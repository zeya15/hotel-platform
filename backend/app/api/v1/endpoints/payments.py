from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin, require_hotel_staff
from app.core.config import settings
from app.core.database import get_db
from app.models.booking import Reservation
from app.models.payment import Payment
from app.schemas.payment import ManualPaymentRequest, OnvoCheckoutRequest, PaymentOut, SINPESubmitRequest, StripeCheckoutRequest
from app.services.booking_engine import BookingEngine
from app.services.payment_service import PaymentService

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/stripe/checkout", response_model=dict)
async def stripe_checkout(
    body: StripeCheckoutRequest,
    db: AsyncSession = Depends(get_db),
):
    svc = PaymentService(db)
    session_url = await svc.create_stripe_checkout(body)
    return {"checkout_url": session_url}


@router.post("/stripe/webhook", status_code=status.HTTP_200_OK)
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")

    svc = PaymentService(db)
    try:
        await svc.process_stripe_webhook(payload, sig)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {"received": True}


@router.post("/sinpe/submit", status_code=status.HTTP_200_OK)
async def submit_sinpe(body: SINPESubmitRequest, db: AsyncSession = Depends(get_db)):
    """Public — guest submits SINPE confirmation number. Admin will verify and confirm."""
    engine = BookingEngine(db)
    reservation = await engine.get_booking(body.reservation_id)
    if not reservation or reservation.estado != "PENDING_PAYMENT":
        raise HTTPException(status_code=409, detail="Reserva no válida o ya procesada.")

    payment = Payment(
        reservation_id=body.reservation_id,
        monto=float(reservation.total),
        moneda=reservation.moneda,
        tasa_cambio=1.0,
        metodo="sinpe",
        estado="PENDING",
        referencia_externa=body.referencia,
        comprobante_url=body.comprobante_url,
    )
    db.add(payment)
    await db.flush()
    await engine.transition_status(body.reservation_id, "AWAITING_MANUAL_PAYMENT")
    await db.commit()
    return {"ok": True, "reservation_id": body.reservation_id}


@router.post("/onvo/checkout", response_model=dict)
async def onvo_checkout(
    body: OnvoCheckoutRequest,
    db: AsyncSession = Depends(get_db),
):
    svc = PaymentService(db)
    try:
        checkout_url = await svc.create_onvo_checkout(body)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"checkout_url": checkout_url}


@router.post("/onvo/webhook", status_code=status.HTTP_200_OK)
async def onvo_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    payload = await request.body()
    secret_header = request.headers.get("x-webhook-secret", "")

    svc = PaymentService(db)
    try:
        await svc.process_onvo_webhook(payload, secret_header)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {"received": True}


@router.post("/manual", response_model=PaymentOut)
async def register_manual_payment(
    body: ManualPaymentRequest,
    payload: dict = Depends(require_hotel_staff),
    db: AsyncSession = Depends(get_db),
):
    svc = PaymentService(db)
    return await svc.register_manual_payment(body, approver_id=int(payload["sub"]))
