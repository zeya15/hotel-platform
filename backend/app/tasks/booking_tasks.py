import asyncio
from datetime import datetime, timezone, timedelta

from sqlalchemy import select, update

from app.tasks.worker import celery_app


def _run(coro):
    """Run an async coroutine from a sync Celery task."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(name="app.tasks.booking_tasks.expire_pending_booking", bind=True, max_retries=3)
def expire_pending_booking(self, reservation_id: int):
    """
    Called after BOOKING_LOCK_TTL_SECONDS. If the reservation is still
    PENDING_PAYMENT, transition it to EXPIRED and release the Redis lock.
    """
    async def _expire():
        from app.core.database import AsyncSessionLocal
        from app.models.booking import Reservation
        from app.services.booking_engine import BookingEngine

        async with AsyncSessionLocal() as db:
            engine = BookingEngine(db)
            booking = await engine.get_booking(reservation_id)
            if booking and booking.estado == "PENDING_PAYMENT":
                await engine.transition_status(reservation_id, "EXPIRED")
                await db.commit()

    try:
        _run(_expire())
    except Exception as exc:
        raise self.retry(exc=exc, countdown=30)


@celery_app.task(name="app.tasks.booking_tasks.send_confirmation_email")
def send_confirmation_email(reservation_id: int):
    """Send booking confirmation email to the guest."""
    async def _send():
        from app.core.database import AsyncSessionLocal
        from app.models.booking import Reservation
        from app.models.user import User

        async with AsyncSessionLocal() as db:
            reservation = await db.get(Reservation, reservation_id)
            if not reservation:
                return

            guest = await db.get(User, reservation.cliente_id)
            if not guest:
                return

            # TODO: integrate FastAPI-Mail when SMTP is configured
            print(f"[EMAIL] Confirmation sent to {guest.email} for reservation #{reservation_id}")

    _run(_send())


@celery_app.task(name="app.tasks.booking_tasks.release_expired_locks")
def release_expired_locks():
    """Sweep task: expire any PENDING_PAYMENT reservation older than TTL that slipped through."""
    async def _sweep():
        from app.core.database import AsyncSessionLocal
        from app.core.config import settings
        from app.models.booking import Reservation
        from app.services.booking_engine import BookingEngine
        from sqlalchemy import select

        cutoff = datetime.now(timezone.utc) - timedelta(seconds=settings.BOOKING_LOCK_TTL_SECONDS + 60)

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Reservation).where(
                    Reservation.estado == "PENDING_PAYMENT",
                    Reservation.created_at < cutoff,
                )
            )
            stale = result.scalars().all()
            engine = BookingEngine(db)
            for reservation in stale:
                await engine.transition_status(reservation.id, "EXPIRED")
            if stale:
                await db.commit()
                print(f"[SWEEP] Expired {len(stale)} stale reservations")

    _run(_sweep())
