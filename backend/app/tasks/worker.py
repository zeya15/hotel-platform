from celery import Celery
from kombu import Exchange, Queue

from app.core.config import settings

# Two isolated queues:
#   critical-booking — payment confirmation, lock expiry, inventory sync.
#                      A delay here causes overbooking risk or lost revenue.
#   notifications    — emails, PDFs, invoices.
#                      Delay here is annoying but not business-critical.
_CRITICAL = "critical-booking"
_NOTIFY = "notifications"

celery_app = Celery(
    "hotel_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.tasks.booking_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_queues=(
        Queue(_CRITICAL, Exchange(_CRITICAL), routing_key=_CRITICAL),
        Queue(_NOTIFY, Exchange(_NOTIFY), routing_key=_NOTIFY),
    ),
    task_default_queue=_CRITICAL,
    task_routes={
        "app.tasks.booking_tasks.expire_pending_booking": {"queue": _CRITICAL},
        "app.tasks.booking_tasks.release_expired_locks": {"queue": _CRITICAL},
        "app.tasks.booking_tasks.send_confirmation_email": {"queue": _NOTIFY},
    },
    beat_schedule={
        "sweep-expired-locks": {
            "task": "app.tasks.booking_tasks.release_expired_locks",
            "schedule": 300.0,
            "options": {"queue": _CRITICAL},
        },
    },
)
