from datetime import date, timedelta

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.redis import booking_lock_key, get_redis, occupancy_cache_key
from app.models.booking import Reservation, ReservationItem
from app.models.hotel import Room, RoomType
from app.schemas.booking import BookingCreateRequest, BookingOut, OccupancyResponse
from app.schemas.room import AvailableRoomTypeOut, RoomTypeOut
from app.services.pricing import PricingService

import json


VALID_TRANSITIONS = {
    "CREATED": {"PENDING_PAYMENT", "CANCELLED"},
    "PENDING_PAYMENT": {"CONFIRMED", "CANCELLED", "EXPIRED", "AWAITING_MANUAL_PAYMENT"},
    "AWAITING_MANUAL_PAYMENT": {"CONFIRMED", "CANCELLED"},
    "CONFIRMED": {"CHECKED_IN", "CANCELLED"},
    "CHECKED_IN": {"CHECKED_OUT"},
    "CHECKED_OUT": {"COMPLETED"},
    "COMPLETED": set(),
    "CANCELLED": set(),
    "EXPIRED": set(),
}


class BookingEngine:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.pricing = PricingService(db)

    # ── Availability ──────────────────────────────────────────────────────────

    async def _get_occupied_room_ids(self, hotel_id: int, check_in: date, check_out: date) -> set[int]:
        """
        Exclusive date range overlap: a room is occupied when any active reservation satisfies
        existing.check_in < requested.check_out AND existing.check_out > requested.check_in
        """
        result = await self.db.execute(
            select(ReservationItem.room_id)
            .join(Reservation, ReservationItem.reservation_id == Reservation.id)
            .where(
                Reservation.hotel_id == hotel_id,
                Reservation.estado.not_in(("CANCELLED", "EXPIRED")),
                Reservation.check_in < check_out,
                Reservation.check_out > check_in,
            )
        )
        return {row[0] for row in result.all()}

    async def get_available_room_types(
        self,
        hotel_id: int,
        check_in: date,
        check_out: date,
        adultos: int,
        ninos: int,
    ) -> list[AvailableRoomTypeOut]:
        occupied_ids = await self._get_occupied_room_ids(hotel_id, check_in, check_out)

        result = await self.db.execute(
            select(RoomType)
            .where(RoomType.hotel_id == hotel_id, RoomType.activo == True)
            .options(selectinload(RoomType.rooms))
        )
        room_types = result.scalars().all()

        available = []
        for rt in room_types:
            free_rooms = [r for r in rt.rooms if r.activo and r.estado == "disponible" and r.id not in occupied_ids]
            if not free_rooms:
                continue

            breakdown = await self.pricing.calculate_total(
                room_type=rt,
                plan_id=None,
                check_in=check_in,
                check_out=check_out,
                adultos=adultos,
                ninos=ninos,
                addon_ids=[],
                hotel_id=hotel_id,
            )

            available.append(AvailableRoomTypeOut(
                room_type=RoomTypeOut.model_validate(rt),
                rooms_disponibles=len(free_rooms),
                precio_calculado=breakdown["subtotal"],
                temporada_activa=breakdown["temporada_nombre"],
                multiplicador=breakdown["multiplicador_temporada_snapshot"],
            ))

        return available

    async def get_first_available_room(
        self, hotel_id: int, room_type_id: int, check_in: date, check_out: date
    ) -> "Room | None":
        occupied = await self._get_occupied_room_ids(hotel_id, check_in, check_out)
        stmt = (
            select(Room)
            .join(RoomType, Room.room_type_id == RoomType.id)
            .where(
                RoomType.id == room_type_id,
                RoomType.hotel_id == hotel_id,
                Room.activo == True,
                Room.estado == "disponible",
            )
        )
        if occupied:
            stmt = stmt.where(Room.id.not_in(occupied))
        stmt = stmt.limit(1)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    # ── Booking Creation ──────────────────────────────────────────────────────

    async def create_booking(self, hotel_id: int, cliente_id: int, data: BookingCreateRequest) -> Reservation:
        redis = await get_redis()
        lock_key = booking_lock_key(data.room_id, str(data.check_in), str(data.check_out))

        # 1. Verify room belongs to hotel and is active
        room = await self.db.get(Room, data.room_id)
        if not room or room.estado != "disponible":
            raise ValueError("Room not available")

        room_type = await self.db.get(RoomType, room.room_type_id)
        if not room_type or room_type.hotel_id != hotel_id:
            raise ValueError("Room does not belong to this hotel")

        # 2. Check no active overlapping reservation (DB-level)
        occupied = await self._get_occupied_room_ids(hotel_id, data.check_in, data.check_out)
        if data.room_id in occupied:
            raise ValueError("Room is already booked for the requested dates")

        # 3. Acquire Redis lock (atomic SETNX + TTL)
        session_lock_value = f"session:{cliente_id}"
        acquired = await redis.set(lock_key, session_lock_value, nx=True, ex=settings.BOOKING_LOCK_TTL_SECONDS)
        if not acquired:
            existing = await redis.get(lock_key)
            if existing != session_lock_value:
                raise ValueError("Room is being reserved by another guest. Please try again shortly.")

        # 4. Calculate pricing snapshot
        addon_ids = [a.addon_id for a in data.addons]
        breakdown = await self.pricing.calculate_total(
            room_type=room_type,
            plan_id=data.plan_id,
            check_in=data.check_in,
            check_out=data.check_out,
            adultos=data.adultos,
            ninos=data.ninos,
            addon_ids=addon_ids,
            hotel_id=hotel_id,
        )

        # 5. Persist reservation + item in one transaction
        reservation = Reservation(
            hotel_id=hotel_id,
            cliente_id=cliente_id,
            check_in=data.check_in,
            check_out=data.check_out,
            adultos=data.adultos,
            ninos=data.ninos,
            estado="PENDING_PAYMENT",
            total=breakdown["subtotal"],
            moneda=data.moneda_pago,
            tasa_cambio_aplicada=1.0,
        )
        self.db.add(reservation)
        await self.db.flush()

        item = ReservationItem(
            reservation_id=reservation.id,
            room_id=data.room_id,
            plan_id=data.plan_id,
            precio_habitacion_snapshot=breakdown["precio_habitacion_snapshot"],
            precio_plan_snapshot=breakdown["precio_plan_snapshot"],
            multiplicador_temporada_snapshot=breakdown["multiplicador_temporada_snapshot"],
            addons_snapshot=breakdown["addons_snapshot"],
            subtotal=breakdown["subtotal"],
        )
        self.db.add(item)
        await self.db.flush()

        # 6. Schedule lock expiry task
        from app.tasks.booking_tasks import expire_pending_booking
        expire_pending_booking.apply_async(
            args=[reservation.id],
            countdown=settings.BOOKING_LOCK_TTL_SECONDS,
        )

        return reservation

    # ── Status Transitions ────────────────────────────────────────────────────

    async def transition_status(self, booking_id: int, new_status: str, notas: str | None = None) -> Reservation:
        reservation = await self.db.get(Reservation, booking_id, options=[selectinload(Reservation.items)])
        if not reservation:
            raise ValueError("Booking not found")

        allowed = VALID_TRANSITIONS.get(reservation.estado, set())
        if new_status not in allowed:
            raise ValueError(f"Cannot transition from {reservation.estado} to {new_status}")

        reservation.estado = new_status
        if notas:
            reservation.notas_internas = notas

        # Release Redis lock when booking is confirmed or cancelled
        if new_status in ("CONFIRMED", "CANCELLED", "EXPIRED"):
            redis = await get_redis()
            for item in reservation.items:
                key = booking_lock_key(item.room_id, str(reservation.check_in), str(reservation.check_out))
                await redis.delete(key)

        # Invalidate occupancy cache
        redis = await get_redis()
        cache_key = occupancy_cache_key(reservation.hotel_id, str(reservation.check_in))
        await redis.delete(cache_key)

        return reservation

    # ── Get single booking ────────────────────────────────────────────────────

    async def get_booking(self, booking_id: int) -> Reservation | None:
        result = await self.db.execute(
            select(Reservation)
            .where(Reservation.id == booking_id)
            .options(selectinload(Reservation.items))
        )
        return result.scalar_one_or_none()

    # ── Occupancy Matrix (admin) ──────────────────────────────────────────────

    async def get_occupancy_matrix(self, hotel_id: int) -> OccupancyResponse:
        from datetime import date as dt_date
        redis = await get_redis()
        today = dt_date.today()
        cache_key = occupancy_cache_key(hotel_id, str(today))

        cached = await redis.get(cache_key)
        if cached:
            data = json.loads(cached)
            return OccupancyResponse(**data)

        end_date = today + timedelta(days=30)

        result = await self.db.execute(
            select(Room)
            .join(RoomType, Room.room_type_id == RoomType.id)
            .where(RoomType.hotel_id == hotel_id, Room.activo == True)
        )
        rooms = result.scalars().all()

        res_result = await self.db.execute(
            select(Reservation, ReservationItem.room_id)
            .join(ReservationItem, ReservationItem.reservation_id == Reservation.id)
            .where(
                Reservation.hotel_id == hotel_id,
                Reservation.estado.not_in(("CANCELLED", "EXPIRED")),
                Reservation.check_in < end_date,
                Reservation.check_out > today,
            )
        )

        occupied: dict[int, set[str]] = {}
        for row in res_result.all():
            reservation, room_id = row
            if room_id not in occupied:
                occupied[room_id] = set()
            current = reservation.check_in
            while current < reservation.check_out:
                occupied[room_id].add(str(current))
                current += timedelta(days=1)

        grid: dict[int, dict[str, str]] = {}
        for room in rooms:
            grid[room.id] = {}
            current = today
            while current < end_date:
                date_str = str(current)
                grid[room.id][date_str] = "ocupada" if date_str in occupied.get(room.id, set()) else "libre"
                current += timedelta(days=1)

        response = OccupancyResponse(hotel_id=hotel_id, fecha_inicio=today, fecha_fin=end_date, grid=grid)
        await redis.set(cache_key, response.model_dump_json(), ex=60)
        return response
