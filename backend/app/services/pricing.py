import json
from datetime import date
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.catalog import Addon, RateAndPlan, Season
from app.models.hotel import RoomType

# TTL del cache de temporadas: 10 minutos. Se invalida explícitamente cuando
# el admin crea/modifica una temporada vía invalidate_seasons_cache().
_SEASONS_CACHE_TTL = 600


def _seasons_cache_key(hotel_id: int) -> str:
    return f"seasons_config:{hotel_id}"


async def warm_seasons_cache(hotel_id: int, db: AsyncSession) -> None:
    """Called on app startup and after admin updates seasons."""
    from app.core.redis import get_redis

    result = await db.execute(
        select(Season).where(Season.hotel_id == hotel_id, Season.activo == True)
    )
    seasons = result.scalars().all()
    payload = [
        {
            "nombre": s.nombre,
            "fecha_inicio": str(s.fecha_inicio),
            "fecha_fin": str(s.fecha_fin),
            "multiplicador": float(s.multiplicador),
        }
        for s in seasons
    ]
    redis = await get_redis()
    await redis.set(_seasons_cache_key(hotel_id), json.dumps(payload), ex=_SEASONS_CACHE_TTL)


async def invalidate_seasons_cache(hotel_id: int) -> None:
    """Call this from admin endpoints whenever seasons are created/updated/deleted."""
    from app.core.redis import get_redis

    redis = await get_redis()
    await redis.delete(_seasons_cache_key(hotel_id))


class PricingService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _load_seasons(self, hotel_id: int) -> list[dict]:
        """Load season rules from Redis cache; fall back to DB and re-cache on miss."""
        from app.core.redis import get_redis

        redis = await get_redis()
        raw = await redis.get(_seasons_cache_key(hotel_id))
        if raw:
            return json.loads(raw)

        # Cache miss — load from DB and repopulate
        result = await self.db.execute(
            select(Season).where(Season.hotel_id == hotel_id, Season.activo == True)
        )
        seasons = result.scalars().all()
        payload = [
            {
                "nombre": s.nombre,
                "fecha_inicio": str(s.fecha_inicio),
                "fecha_fin": str(s.fecha_fin),
                "multiplicador": float(s.multiplicador),
            }
            for s in seasons
        ]
        await redis.set(_seasons_cache_key(hotel_id), json.dumps(payload), ex=_SEASONS_CACHE_TTL)
        return payload

    async def get_season_multiplier(self, hotel_id: int, check_in: date, check_out: date) -> tuple[float, str | None]:
        """Returns the highest multiplier among all cached seasons overlapping the stay.
        No DB call when cache is warm — critical for fast pricing during peak traffic."""
        seasons = await self._load_seasons(hotel_id)

        overlapping = [
            s for s in seasons
            if s["fecha_inicio"] <= str(check_out) and s["fecha_fin"] >= str(check_in)
        ]
        if not overlapping:
            return 1.0, None

        best = max(overlapping, key=lambda s: s["multiplicador"])
        return best["multiplicador"], best["nombre"]

    async def calculate_total(
        self,
        room_type: RoomType,
        plan_id: int | None,
        check_in: date,
        check_out: date,
        adultos: int,
        ninos: int,
        addon_ids: list[int],
        hotel_id: int,
    ) -> dict:
        """
        Precio Total = (precio_base + plan_adulto * adultos + plan_nino * ninos) * noches * multiplicador_temporada
                     + sum(addons)
        Devuelve el desglose completo para snapshot inmutable.
        """
        nights = (check_out - check_in).days
        if nights <= 0:
            raise ValueError("Stay must be at least 1 night")

        multiplier, season_name = await self.get_season_multiplier(hotel_id, check_in, check_out)

        plan_cost_adult = Decimal("0")
        plan_cost_child = Decimal("0")
        plan_snapshot_price = Decimal("0")

        if plan_id:
            plan = await self.db.get(RateAndPlan, plan_id)
            if plan and plan.hotel_id == hotel_id and plan.activo:
                plan_cost_adult = Decimal(str(plan.costo_extra_adulto))
                plan_cost_child = Decimal(str(plan.costo_extra_nino))
                plan_snapshot_price = (plan_cost_adult * adultos + plan_cost_child * ninos) * nights

        base = Decimal(str(room_type.precio_base))
        room_subtotal = (base + plan_cost_adult * adultos + plan_cost_child * ninos) * Decimal(str(nights)) * Decimal(str(multiplier))

        addons_detail = []
        addons_total = Decimal("0")

        if addon_ids:
            result = await self.db.execute(
                select(Addon).where(Addon.id.in_(addon_ids), Addon.hotel_id == hotel_id, Addon.activo == True)
            )
            for addon in result.scalars().all():
                precio = Decimal(str(addon.precio))
                if addon.tipo_cobro == "por_noche":
                    costo = precio * nights
                elif addon.tipo_cobro == "por_persona":
                    costo = precio * (adultos + ninos)
                else:
                    costo = precio

                addons_total += costo
                addons_detail.append({
                    "addon_id": addon.id,
                    "nombre": addon.nombre,
                    "precio": float(addon.precio),
                    "tipo_cobro": addon.tipo_cobro,
                    "costo_total": float(costo),
                })

        total = room_subtotal + addons_total

        return {
            "precio_habitacion_snapshot": float(base),
            "precio_plan_snapshot": float(plan_snapshot_price),
            "multiplicador_temporada_snapshot": multiplier,
            "temporada_nombre": season_name,
            "addons_snapshot": addons_detail,
            "subtotal": float(total),
            "nights": nights,
        }
