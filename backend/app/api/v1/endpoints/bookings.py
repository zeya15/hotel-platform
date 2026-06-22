import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_payload, require_hotel_staff
from app.core.database import get_db
from app.models.user import User
from app.schemas.booking import (
    BookingCreateRequest,
    BookingOut,
    BookingPublicOut,
    BookingStatusUpdate,
    GuestBookingRequest,
    OccupancyResponse,
)
from app.services.booking_engine import BookingEngine

router = APIRouter(prefix="/bookings", tags=["bookings"])
_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/guest", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
async def create_guest_booking(
    body: GuestBookingRequest,
    db: AsyncSession = Depends(get_db),
):
    """Public endpoint for guest checkout — no JWT required."""
    engine = BookingEngine(db)

    # 1. Find first available room of the requested type
    room = await engine.get_first_available_room(
        hotel_id=body.hotel_id,
        room_type_id=body.room_type_id,
        check_in=body.check_in,
        check_out=body.check_out,
    )
    if not room:
        raise HTTPException(status_code=409, detail="No hay habitaciones disponibles para esas fechas.")

    # 2. Find or create guest user
    result = await db.execute(select(User).where(User.email == body.email))
    guest = result.scalar_one_or_none()
    if not guest:
        guest = User(
            hotel_id=body.hotel_id,
            email=body.email,
            hashed_password=_pwd.hash(secrets.token_urlsafe(16)),
            nombre=body.nombre,
            telefono=body.telefono,
            rol="huesped",
            activo=True,
        )
        db.add(guest)
        await db.flush()

    # 3. Create booking
    booking_data = BookingCreateRequest(
        hotel_id=body.hotel_id,
        room_id=room.id,
        plan_id=body.plan_id,
        check_in=body.check_in,
        check_out=body.check_out,
        adultos=body.adultos,
        ninos=body.ninos,
        moneda_pago=body.moneda_pago,
    )
    try:
        reservation = await engine.create_booking(
            hotel_id=body.hotel_id,
            cliente_id=guest.id,
            data=booking_data,
        )
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))

    if body.notas:
        reservation.notas_internas = body.notas

    await db.commit()
    # Re-fetch with items eagerly loaded so response serialization doesn't
    # trigger a lazy load outside the async context (MissingGreenlet).
    return await engine.get_booking(reservation.id)


@router.get("/public/{booking_id}", response_model=BookingPublicOut)
async def get_public_booking(booking_id: int, db: AsyncSession = Depends(get_db)):
    """Public read — only safe fields, used for confirmation page."""
    engine = BookingEngine(db)
    booking = await engine.get_booking(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.post("", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
async def create_booking(
    body: BookingCreateRequest,
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
):
    engine = BookingEngine(db)
    try:
        reservation = await engine.create_booking(
            hotel_id=body.hotel_id,
            cliente_id=int(payload["sub"]),
            data=body,
        )
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    await db.flush()
    # Eager-load items to avoid lazy-load during response serialization.
    return await engine.get_booking(reservation.id)


@router.get("/{booking_id}", response_model=BookingOut)
async def get_booking(
    booking_id: int,
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
):
    engine = BookingEngine(db)
    booking = await engine.get_booking(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Guests can only see their own bookings
    is_staff = payload.get("role") in ("admin", "recepcionista", "superadmin")
    if not is_staff and booking.cliente_id != int(payload["sub"]):
        raise HTTPException(status_code=403, detail="Forbidden")

    return booking


@router.patch("/{booking_id}/status", response_model=BookingOut)
async def update_status(
    booking_id: int,
    body: BookingStatusUpdate,
    payload: dict = Depends(require_hotel_staff),
    db: AsyncSession = Depends(get_db),
):
    engine = BookingEngine(db)
    try:
        return await engine.transition_status(booking_id, body.estado, body.notas_internas)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/admin/occupancy", response_model=OccupancyResponse)
async def occupancy_matrix(
    hotel_id: int,
    payload: dict = Depends(require_hotel_staff),
    db: AsyncSession = Depends(get_db),
):
    engine = BookingEngine(db)
    return await engine.get_occupancy_matrix(hotel_id)
