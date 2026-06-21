import redis.asyncio as aioredis

from app.core.config import settings

_redis_client: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = await aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
        )
    return _redis_client


async def close_redis() -> None:
    global _redis_client
    if _redis_client:
        await _redis_client.aclose()
        _redis_client = None


def booking_lock_key(room_id: int, check_in: str, check_out: str) -> str:
    return f"booking_lock:{room_id}:{check_in}:{check_out}"


def occupancy_cache_key(hotel_id: int, start_date: str) -> str:
    return f"occupancy:{hotel_id}:{start_date}"
