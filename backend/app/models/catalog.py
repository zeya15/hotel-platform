from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class RateAndPlan(Base, TimestampMixin):
    __tablename__ = "rates_and_plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    hotel_id: Mapped[int] = mapped_column(Integer, ForeignKey("hotels.id", ondelete="CASCADE"), nullable=False, index=True)
    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(String(1000))
    costo_extra_adulto: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    costo_extra_nino: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    incluye_desayuno: Mapped[bool] = mapped_column(Boolean, default=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)


class Addon(Base, TimestampMixin):
    __tablename__ = "addons"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    hotel_id: Mapped[int] = mapped_column(Integer, ForeignKey("hotels.id", ondelete="CASCADE"), nullable=False, index=True)
    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(String(1000))
    precio: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    # fijo | por_noche | por_persona
    tipo_cobro: Mapped[str] = mapped_column(String(20), nullable=False, default="fijo")
    activo: Mapped[bool] = mapped_column(Boolean, default=True)


class Season(Base, TimestampMixin):
    """Temporadas con multiplicadores de precio. Si se superponen, gana el mayor multiplicador."""

    __tablename__ = "seasons"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    hotel_id: Mapped[int] = mapped_column(Integer, ForeignKey("hotels.id", ondelete="CASCADE"), nullable=False, index=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    fecha_inicio: Mapped[date] = mapped_column(Date, nullable=False)
    fecha_fin: Mapped[date] = mapped_column(Date, nullable=False)
    multiplicador: Mapped[float] = mapped_column(Numeric(4, 2), nullable=False, default=1.0)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
