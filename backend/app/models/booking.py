from datetime import date

from sqlalchemy import Date, ForeignKey, Integer, JSON, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class Reservation(Base, TimestampMixin):
    __tablename__ = "reservations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    hotel_id: Mapped[int] = mapped_column(Integer, ForeignKey("hotels.id", ondelete="RESTRICT"), nullable=False, index=True)
    cliente_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    check_in: Mapped[date] = mapped_column(Date, nullable=False)
    check_out: Mapped[date] = mapped_column(Date, nullable=False)
    adultos: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    ninos: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Estado de la máquina: CREATED → PENDING_PAYMENT → CONFIRMED → CHECKED_IN → CHECKED_OUT → COMPLETED / CANCELLED / EXPIRED
    estado: Mapped[str] = mapped_column(String(30), nullable=False, default="CREATED", index=True)

    # Snapshot financiero inmutable al momento de crear la reserva
    total: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    moneda: Mapped[str] = mapped_column(String(3), nullable=False)
    tasa_cambio_aplicada: Mapped[float] = mapped_column(Numeric(10, 6), nullable=False, default=1.0)

    # Notas internas del staff
    notas_internas: Mapped[str | None] = mapped_column(String(2000))

    items: Mapped[list["ReservationItem"]] = relationship(back_populates="reservation", cascade="all, delete-orphan")


class ReservationItem(Base):
    """Detalle inmutable de qué habitación, plan y extras componen la reserva."""

    __tablename__ = "reservation_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    reservation_id: Mapped[int] = mapped_column(Integer, ForeignKey("reservations.id", ondelete="CASCADE"), nullable=False, index=True)
    room_id: Mapped[int] = mapped_column(Integer, ForeignKey("rooms.id", ondelete="RESTRICT"), nullable=False)
    plan_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("rates_and_plans.id", ondelete="SET NULL"))

    # Snapshots de precio en el momento de la reserva — nunca recalcular
    precio_habitacion_snapshot: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    precio_plan_snapshot: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    multiplicador_temporada_snapshot: Mapped[float] = mapped_column(Numeric(4, 2), nullable=False, default=1.0)
    # JSON: [{addon_id, nombre, precio, tipo_cobro}]
    addons_snapshot: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    subtotal: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)

    reservation: Mapped["Reservation"] = relationship(back_populates="items")
