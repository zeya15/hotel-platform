import hmac
import json

import httpx
import stripe
from datetime import datetime, timezone

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.models.booking import Reservation
from app.models.payment import Payment
from app.schemas.payment import ManualPaymentRequest, OnvoCheckoutRequest, StripeCheckoutRequest
from app.services.booking_engine import BookingEngine

stripe.api_key = settings.STRIPE_SECRET_KEY


class PaymentService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.engine = BookingEngine(db)

    async def create_stripe_checkout(self, data: StripeCheckoutRequest) -> str:
        reservation = await self.engine.get_booking(data.reservation_id)
        if not reservation or reservation.estado != "PENDING_PAYMENT":
            raise ValueError("Reservation not in PENDING_PAYMENT state")

        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": reservation.moneda.lower(),
                    "unit_amount": int(reservation.total * 100),
                    "product_data": {"name": f"Reserva #{reservation.id}"},
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=data.success_url,
            cancel_url=data.cancel_url,
            metadata={"reservation_id": str(reservation.id)},
        )
        return session.url

    async def process_stripe_webhook(self, payload: bytes, sig: str) -> None:
        try:
            event = stripe.Webhook.construct_event(payload, sig, settings.STRIPE_WEBHOOK_SECRET)
        except stripe.error.SignatureVerificationError:
            raise ValueError("Invalid webhook signature")

        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            reservation_id = int(session["metadata"]["reservation_id"])
            charge_id = session.get("payment_intent", session.get("id"))

            await self._confirm_payment(
                reservation_id=reservation_id,
                monto=session["amount_total"] / 100,
                moneda=session["currency"].upper(),
                metodo="stripe",
                referencia_externa=charge_id,
            )

    async def _confirm_payment(
        self,
        reservation_id: int,
        monto: float,
        moneda: str,
        metodo: str,
        referencia_externa: str | None,
    ) -> None:
        # Idempotency guard BEFORE acquiring the row lock — cheap check first
        if referencia_externa:
            existing = await self.db.execute(
                select(Payment).where(Payment.referencia_externa == referencia_externa)
            )
            if existing.scalar_one_or_none():
                return

        # Escalate to SERIALIZABLE for the critical write window.
        # SELECT ... FOR UPDATE locks the reservation row so a concurrent webhook
        # for the same reservation_id cannot race past this point.
        await self.db.execute(text("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE"))

        locked = await self.db.execute(
            select(Reservation)
            .where(Reservation.id == reservation_id)
            .with_for_update()
        )
        reservation = locked.scalar_one_or_none()

        if not reservation or reservation.estado != "PENDING_PAYMENT":
            # Already confirmed by a concurrent webhook — nothing to do
            return

        payment = Payment(
            reservation_id=reservation_id,
            monto=monto,
            moneda=moneda,
            tasa_cambio=1.0,
            metodo=metodo,
            estado="COMPLETED",
            referencia_externa=referencia_externa,
        )
        self.db.add(payment)
        await self.db.flush()

        await self.engine.transition_status(reservation_id, "CONFIRMED")

        from app.tasks.booking_tasks import send_confirmation_email
        send_confirmation_email.apply_async(args=[reservation_id], queue="notifications")

    async def create_onvo_checkout(self, data: OnvoCheckoutRequest) -> str:
        reservation = await self.engine.get_booking(data.reservation_id)
        if not reservation or reservation.estado != "PENDING_PAYMENT":
            raise ValueError("Reservation not in PENDING_PAYMENT state")

        # ONVO expects amounts as integers in the smallest currency unit (x100).
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(
                f"{settings.ONVO_BASE_URL}/v1/checkout/sessions/one-time-link",
                headers={
                    "Authorization": f"Bearer {settings.ONVO_SECRET_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "lineItems": [
                        {
                            "quantity": 1,
                            "unitAmount": int(reservation.total * 100),
                            "currency": reservation.moneda.upper(),
                            "description": f"Reserva #{reservation.id}",
                        }
                    ],
                    "redirectUrl": data.success_url,
                    "cancelUrl": data.cancel_url,
                    "metadata": {"reservation_id": str(reservation.id)},
                },
            )
            resp.raise_for_status()
            return resp.json()["url"]

    async def process_onvo_webhook(self, payload: bytes, secret_header: str) -> None:
        # ONVO transmits the webhook secret directly in the X-Webhook-Secret header.
        if not settings.ONVO_WEBHOOK_SECRET or not hmac.compare_digest(
            secret_header, settings.ONVO_WEBHOOK_SECRET
        ):
            raise ValueError("Invalid ONVO webhook signature")

        event = json.loads(payload)
        if event.get("type") != "payment-intent.succeeded":
            return

        data = event["data"]
        metadata = data.get("metadata") or {}
        reservation_id_raw = metadata.get("reservation_id")
        if not reservation_id_raw:
            return

        await self._confirm_payment(
            reservation_id=int(reservation_id_raw),
            monto=data["amount"] / 100,
            moneda=data["currency"].upper(),
            metodo="onvo",
            referencia_externa=data["id"],
        )

    async def register_manual_payment(self, data: ManualPaymentRequest, approver_id: int) -> Payment:
        reservation = await self.engine.get_booking(data.reservation_id)
        if not reservation:
            raise ValueError("Reservation not found")

        payment = Payment(
            reservation_id=data.reservation_id,
            monto=data.monto,
            moneda=data.moneda,
            tasa_cambio=1.0,
            metodo=data.metodo,
            estado="COMPLETED",
            referencia_externa=data.referencia_externa,
            comprobante_url=data.comprobante_url,
            aprobado_por_id=approver_id,
            aprobado_en=datetime.now(timezone.utc),
        )
        self.db.add(payment)
        await self.db.flush()

        await self.engine.transition_status(data.reservation_id, "CONFIRMED")
        from app.tasks.booking_tasks import send_confirmation_email
        send_confirmation_email.delay(data.reservation_id)

        return payment
