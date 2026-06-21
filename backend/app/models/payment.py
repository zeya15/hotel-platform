from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin


class Payment(Base, TimestampMixin):
    __tablename__ = "payments"
    # referencia_externa única previene duplicados de webhooks (idempotencia)
    __table_args__ = (
        UniqueConstraint("referencia_externa", name="uq_payment_referencia_externa"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    reservation_id: Mapped[int] = mapped_column(Integer, ForeignKey("reservations.id", ondelete="RESTRICT"), nullable=False, index=True)

    monto: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    moneda: Mapped[str] = mapped_column(String(3), nullable=False)
    tasa_cambio: Mapped[float] = mapped_column(Numeric(10, 6), nullable=False, default=1.0)

    # stripe | paypal | sinpe | transferencia | efectivo
    metodo: Mapped[str] = mapped_column(String(30), nullable=False)
    # PENDING | COMPLETED | FAILED | REFUNDED
    estado: Mapped[str] = mapped_column(String(20), nullable=False, default="PENDING")

    # ID externo de Stripe/PayPal/SINPE; NULL para pagos en efectivo
    referencia_externa: Mapped[str | None] = mapped_column(String(255), index=True)
    # Comprobante adjunto (ruta en S3 para transferencias manuales)
    comprobante_url: Mapped[str | None] = mapped_column(String(500))
    # ID del admin que aprobó un pago manual
    aprobado_por_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    aprobado_en: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
