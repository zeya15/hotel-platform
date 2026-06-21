from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PaymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    reservation_id: int
    monto: float
    moneda: str
    tasa_cambio: float
    metodo: str
    estado: str
    referencia_externa: str | None
    comprobante_url: str | None
    created_at: datetime


class ManualPaymentRequest(BaseModel):
    reservation_id: int
    monto: float
    moneda: str
    metodo: str  # sinpe | transferencia | efectivo
    referencia_externa: str | None = None
    comprobante_url: str | None = None


class StripeCheckoutRequest(BaseModel):
    reservation_id: int
    success_url: str
    cancel_url: str


class SINPESubmitRequest(BaseModel):
    reservation_id: int
    referencia: str
    comprobante_url: str | None = None


class OnvoCheckoutRequest(BaseModel):
    reservation_id: int
    success_url: str
    cancel_url: str
