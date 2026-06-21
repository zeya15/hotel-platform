from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.schemas.room import AvailableRoomTypeOut
from app.services.booking_engine import BookingEngine

router = APIRouter(prefix="/availability", tags=["availability"])

# Module-level limiter — shares state with app.state.limiter via the decorator
_limiter = Limiter(key_func=get_remote_address)


@router.get("", response_model=list[AvailableRoomTypeOut])
@_limiter.limit(settings.AVAILABILITY_RATE_LIMIT)
async def check_availability(
    request: Request,  # required by slowapi
    hotel_id: int,
    check_in: date,
    check_out: date,
    adultos: int = 1,
    ninos: int = 0,
    db: AsyncSession = Depends(get_db),
):
    """
    Public endpoint — rate limited per IP to prevent scraping bots from
    hammering the booking engine during peak season (Semana Santa, etc.).
    Default: 60 requests/minute per IP. Configurable via AVAILABILITY_RATE_LIMIT.
    """
    if check_out <= check_in:
        raise HTTPException(status_code=400, detail="check_out must be after check_in")

    engine = BookingEngine(db)
    return await engine.get_available_room_types(
        hotel_id=hotel_id,
        check_in=check_in,
        check_out=check_out,
        adultos=adultos,
        ninos=ninos,
    )
