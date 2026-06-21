from fastapi import APIRouter

from app.api.v1.endpoints import admin, auth, availability, bookings, payments, plans, rooms

api_router = APIRouter()

api_router.include_router(admin.router)
api_router.include_router(auth.router)
api_router.include_router(availability.router)
api_router.include_router(bookings.router)
api_router.include_router(payments.router)
api_router.include_router(plans.router)
api_router.include_router(rooms.router)
