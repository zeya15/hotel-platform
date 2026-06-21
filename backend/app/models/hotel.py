from sqlalchemy import JSON, Boolean, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class Hotel(Base, TimestampMixin):
    __tablename__ = "hotels"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    moneda_base: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    zona_horaria: Mapped[str] = mapped_column(String(50), nullable=False, default="America/Costa_Rica")
    activo: Mapped[bool] = mapped_column(Boolean, default=True)

    room_types: Mapped[list["RoomType"]] = relationship(back_populates="hotel", cascade="all, delete-orphan")


class RoomType(Base, TimestampMixin):
    __tablename__ = "room_types"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    hotel_id: Mapped[int] = mapped_column(Integer, ForeignKey("hotels.id", ondelete="CASCADE"), nullable=False, index=True)
    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(String(2000))
    capacidad_max: Mapped[int] = mapped_column(Integer, nullable=False, default=2)
    precio_base: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    imagen_url: Mapped[str | None] = mapped_column(String(500))
    amenidades: Mapped[list | None] = mapped_column(JSON)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)

    hotel: Mapped["Hotel"] = relationship(back_populates="room_types")
    rooms: Mapped[list["Room"]] = relationship(back_populates="room_type", cascade="all, delete-orphan")


class Room(Base, TimestampMixin):
    __tablename__ = "rooms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    room_type_id: Mapped[int] = mapped_column(Integer, ForeignKey("room_types.id", ondelete="CASCADE"), nullable=False, index=True)
    numero: Mapped[str] = mapped_column(String(20), nullable=False)
    piso: Mapped[int | None] = mapped_column(Integer)
    # Estado físico de la habitación (mantenimiento, fuera de servicio, etc.)
    estado: Mapped[str] = mapped_column(String(30), nullable=False, default="disponible")
    activo: Mapped[bool] = mapped_column(Boolean, default=True)

    room_type: Mapped["RoomType"] = relationship(back_populates="rooms")
