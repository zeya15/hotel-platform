from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin, require_hotel_staff
from app.core.database import get_db
from app.models.booking import Reservation, ReservationItem
from app.models.catalog import Season
from app.models.hotel import Room, RoomType
from app.models.payment import Payment
from app.models.user import User
from app.services.pricing import invalidate_seasons_cache

router = APIRouter(prefix="/admin", tags=["admin"])


# ── Stats ─────────────────────────────────────────────────────────────────


class StatsOut(BaseModel):
    reservas_hoy: int
    checkins_pendientes: int
    porcentaje_ocupacion: float
    ingresos_mes: float
    reservas_pendientes_pago: int


@router.get("/stats", response_model=StatsOut)
async def get_stats(
    hotel_id: int,
    payload: dict = Depends(require_hotel_staff),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    first_of_month = today.replace(day=1)

    # Reservations made today (created today)
    reservas_hoy = (
        await db.execute(
            select(func.count(Reservation.id)).where(
                Reservation.hotel_id == hotel_id,
                func.date(Reservation.created_at) == today,
                Reservation.estado.not_in(("CANCELLED", "EXPIRED")),
            )
        )
    ).scalar_one()

    # Confirmed reservations with check_in today
    checkins = (
        await db.execute(
            select(func.count(Reservation.id)).where(
                Reservation.hotel_id == hotel_id,
                Reservation.check_in == today,
                Reservation.estado == "CONFIRMED",
            )
        )
    ).scalar_one()

    # Occupancy today: rooms with active reservation
    occupied_ids = (
        await db.execute(
            select(ReservationItem.room_id)
            .join(Reservation, ReservationItem.reservation_id == Reservation.id)
            .where(
                Reservation.hotel_id == hotel_id,
                Reservation.estado.not_in(("CANCELLED", "EXPIRED")),
                Reservation.check_in <= today,
                Reservation.check_out > today,
            )
        )
    ).scalars().all()

    total_rooms = (
        await db.execute(
            select(func.count(Room.id))
            .join(RoomType, Room.room_type_id == RoomType.id)
            .where(RoomType.hotel_id == hotel_id, Room.activo == True)
        )
    ).scalar_one()

    ocupacion = (len(set(occupied_ids)) / total_rooms * 100) if total_rooms else 0.0

    # Revenue this month (confirmed/completed)
    ingresos = (
        await db.execute(
            select(func.coalesce(func.sum(Reservation.total), 0)).where(
                Reservation.hotel_id == hotel_id,
                Reservation.estado.in_(("CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "COMPLETED")),
                Reservation.created_at >= first_of_month,
            )
        )
    ).scalar_one()

    # Pending payment count
    pendientes = (
        await db.execute(
            select(func.count(Reservation.id)).where(
                Reservation.hotel_id == hotel_id,
                Reservation.estado.in_(("PENDING_PAYMENT", "AWAITING_MANUAL_PAYMENT")),
            )
        )
    ).scalar_one()

    return StatsOut(
        reservas_hoy=reservas_hoy,
        checkins_pendientes=checkins,
        porcentaje_ocupacion=round(ocupacion, 1),
        ingresos_mes=float(ingresos),
        reservas_pendientes_pago=pendientes,
    )


# ── Reservation list ──────────────────────────────────────────────────────


class GuestSnippet(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    nombre: str
    email: str
    telefono: str | None = None


class ReservationListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    check_in: date
    check_out: date
    adultos: int
    ninos: int
    estado: str
    total: float
    moneda: str
    notas_internas: str | None = None
    guest: GuestSnippet | None = None


@router.get("/reservations", response_model=list[ReservationListItem])
async def list_reservations(
    hotel_id: int,
    estado: str | None = None,
    limit: int = 50,
    offset: int = 0,
    payload: dict = Depends(require_hotel_staff),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Reservation, User)
        .join(User, Reservation.cliente_id == User.id, isouter=True)
        .where(Reservation.hotel_id == hotel_id)
    )
    if estado:
        stmt = stmt.where(Reservation.estado == estado)
    stmt = stmt.order_by(Reservation.created_at.desc()).limit(limit).offset(offset)

    rows = (await db.execute(stmt)).all()
    result = []
    for reservation, user in rows:
        item = ReservationListItem.model_validate(reservation)
        if user:
            item.guest = GuestSnippet.model_validate(user)
        result.append(item)
    return result


@router.patch("/reservations/{reservation_id}/status")
async def change_reservation_status(
    reservation_id: int,
    body: dict,
    payload: dict = Depends(require_hotel_staff),
    db: AsyncSession = Depends(get_db),
):
    from app.services.booking_engine import BookingEngine, VALID_TRANSITIONS
    engine = BookingEngine(db)
    try:
        updated = await engine.transition_status(
            reservation_id, body["estado"], body.get("notas_internas")
        )
        await db.commit()
        return {"id": updated.id, "estado": updated.estado}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Seasons CRUD ─────────────────────────────────────────────────────────


class SeasonIn(BaseModel):
    nombre: str
    fecha_inicio: date
    fecha_fin: date
    multiplicador: float


class SeasonOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    hotel_id: int
    nombre: str
    fecha_inicio: date
    fecha_fin: date
    multiplicador: float
    activo: bool


@router.get("/seasons", response_model=list[SeasonOut])
async def list_seasons(
    hotel_id: int,
    payload: dict = Depends(require_hotel_staff),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Season)
        .where(Season.hotel_id == hotel_id)
        .order_by(Season.fecha_inicio.desc())
    )
    return result.scalars().all()


@router.post("/seasons", response_model=SeasonOut, status_code=201)
async def create_season(
    hotel_id: int,
    body: SeasonIn,
    payload: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    season = Season(hotel_id=hotel_id, **body.model_dump())
    db.add(season)
    await db.commit()
    await db.refresh(season)
    await invalidate_seasons_cache(hotel_id)
    return season


@router.patch("/seasons/{season_id}", response_model=SeasonOut)
async def update_season(
    season_id: int,
    body: SeasonIn,
    payload: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    season = await db.get(Season, season_id)
    if not season:
        raise HTTPException(status_code=404, detail="Season not found")
    for field, val in body.model_dump().items():
        setattr(season, field, val)
    await db.commit()
    await db.refresh(season)
    await invalidate_seasons_cache(season.hotel_id)
    return season


@router.delete("/seasons/{season_id}", status_code=204)
async def delete_season(
    season_id: int,
    payload: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    season = await db.get(Season, season_id)
    if not season:
        raise HTTPException(status_code=404, detail="Season not found")
    hotel_id = season.hotel_id
    await db.delete(season)
    await db.commit()
    await invalidate_seasons_cache(hotel_id)


# ── Room type management ─────────────────────────────────────────────────


class RoomTypePatch(BaseModel):
    nombre: str | None = None
    descripcion: str | None = None
    precio_base: float | None = None
    imagen_url: str | None = None
    amenidades: list[str] | None = None
    activo: bool | None = None


@router.patch("/room-types/{room_type_id}")
async def patch_room_type(
    room_type_id: int,
    body: RoomTypePatch,
    payload: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    rt = await db.get(RoomType, room_type_id)
    if not rt:
        raise HTTPException(status_code=404, detail="Room type not found")
    for field, val in body.model_dump(exclude_none=True).items():
        setattr(rt, field, val)
    await db.commit()
    await db.refresh(rt)
    return {"id": rt.id, "nombre": rt.nombre, "activo": rt.activo}
