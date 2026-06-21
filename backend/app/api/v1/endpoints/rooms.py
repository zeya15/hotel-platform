from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.core.database import get_db
from app.models.hotel import Room, RoomType
from app.schemas.room import RoomOut, RoomTypeOut

router = APIRouter(prefix="/rooms", tags=["rooms"])


@router.get("/types", response_model=list[RoomTypeOut])
async def list_room_types(hotel_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(RoomType).where(RoomType.hotel_id == hotel_id, RoomType.activo == True)
    )
    return result.scalars().all()


@router.get("/types/{room_type_id}", response_model=RoomTypeOut)
async def get_room_type(room_type_id: int, db: AsyncSession = Depends(get_db)):
    rt = await db.get(RoomType, room_type_id)
    if not rt:
        raise HTTPException(status_code=404, detail="Room type not found")
    return rt


@router.get("", response_model=list[RoomOut])
async def list_rooms(
    hotel_id: int,
    payload: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Room)
        .join(RoomType, Room.room_type_id == RoomType.id)
        .where(RoomType.hotel_id == hotel_id, Room.activo == True)
    )
    return result.scalars().all()
