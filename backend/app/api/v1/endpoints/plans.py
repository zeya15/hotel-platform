from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.catalog import RateAndPlan

router = APIRouter(prefix="/plans", tags=["plans"])


class PlanOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    hotel_id: int
    nombre: str
    descripcion: str | None = None
    costo_extra_adulto: float
    costo_extra_nino: float
    incluye_desayuno: bool


@router.get("", response_model=list[PlanOut])
async def list_plans(hotel_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(RateAndPlan).where(
            RateAndPlan.hotel_id == hotel_id,
            RateAndPlan.activo == True,
        )
    )
    return result.scalars().all()
