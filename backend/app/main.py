from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.core.redis import close_redis, get_redis
from app.api.v1.router import api_router

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await get_redis()
    # Pre-warm season cache for all active hotels at startup
    try:
        from sqlalchemy import select
        from app.models.hotel import Hotel
        from app.services.pricing import warm_seasons_cache

        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Hotel.id).where(Hotel.activo == True))
            hotel_ids = [row[0] for row in result.all()]
            for hotel_id in hotel_ids:
                await warm_seasons_cache(hotel_id, db)
    except Exception:
        pass  # DB may not be ready on first boot; pricing will cache on first miss

    yield
    await close_redis()


app = FastAPI(
    title="Hotel Platform API",
    version="1.0.0",
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok"}
