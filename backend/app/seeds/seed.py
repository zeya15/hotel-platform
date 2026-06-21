"""
Demo seed for Hotel Paraíso Verde.

Usage (from /backend):
    python -m app.seeds.seed

Idempotent: skips if hotel slug already exists.
"""
import asyncio
from datetime import date

from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models.base import Base  # noqa: F401 — triggers mapper registration
from app.models.booking import Reservation, ReservationItem  # noqa: F401
from app.models.catalog import Addon, RateAndPlan, Season
from app.models.hotel import Hotel, Room, RoomType
from app.models.payment import Payment  # noqa: F401
from app.models.user import User

_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def seed(db: AsyncSession) -> None:
    # ── Guard: skip if already seeded ────────────────────────────────
    existing = await db.execute(select(Hotel).where(Hotel.slug == "paraiso-verde"))
    if existing.scalar_one_or_none():
        print("Seed already applied — skipping.")
        return

    # ── Hotel ─────────────────────────────────────────────────────────
    hotel = Hotel(
        nombre="Hotel Paraíso Verde",
        slug="paraiso-verde",
        moneda_base="USD",
        zona_horaria="America/Costa_Rica",
        activo=True,
    )
    db.add(hotel)
    await db.flush()  # get hotel.id

    # ── Admin user ────────────────────────────────────────────────────
    admin = User(
        hotel_id=hotel.id,
        email="admin@hotelparaisoverde.cr",
        hashed_password=_pwd.hash("Admin1234!"),
        nombre="Administrador",
        apellido="Demo",
        telefono="+506 2556-1234",
        rol="admin",
        activo=True,
    )
    db.add(admin)

    # ── Room types ────────────────────────────────────────────────────
    room_types_data = [
        {
            "nombre": "Cabaña Estándar",
            "descripcion": (
                "Cabaña privada de 28 m² rodeada de jardín tropical. "
                "Cama doble o dos individuales, baño con ducha de lluvia, "
                "terraza privada con hamaca y vista al jardín."
            ),
            "capacidad_max": 2,
            "precio_base": 120.00,
            "imagen_url": None,
            "amenidades": [
                "Cama doble",
                "Terraza privada",
                "Ducha de lluvia",
                "Aire acondicionado",
                "WiFi",
                "Minibar",
            ],
        },
        {
            "nombre": "Habitación Superior",
            "descripcion": (
                "Habitación de 35 m² con vista al bosque. Cama king size, "
                "escritorio de trabajo, bañera de inmersión y balcón privado "
                "con vista panorámica al valle de Turrialba."
            ),
            "capacidad_max": 2,
            "precio_base": 155.00,
            "imagen_url": None,
            "amenidades": [
                "Cama king size",
                "Balcón con vista al valle",
                "Bañera de inmersión",
                "Escritorio de trabajo",
                "Aire acondicionado",
                "WiFi",
                "Caja fuerte",
                "Minibar",
            ],
        },
        {
            "nombre": "Suite Bosque",
            "descripcion": (
                "Suite de 55 m² integrada al bosque con sala de estar, "
                "habitación separada con cama king, jacuzzi exterior y "
                "terraza de 20 m² con vista al bosque primario."
            ),
            "capacidad_max": 3,
            "precio_base": 210.00,
            "imagen_url": None,
            "amenidades": [
                "Cama king size",
                "Sala de estar",
                "Jacuzzi exterior",
                "Terraza 20 m²",
                "Bañera de inmersión",
                "Aire acondicionado",
                "WiFi",
                "Nespresso",
                "Caja fuerte",
            ],
        },
        {
            "nombre": "Cabaña Familiar",
            "descripcion": (
                "Cabaña de dos plantas ideal para familias. Planta baja: sala, "
                "cocina equipada y baño. Planta alta: dos habitaciones y baño. "
                "Jardín privado con parrilla y zona de juegos."
            ),
            "capacidad_max": 5,
            "precio_base": 240.00,
            "imagen_url": None,
            "amenidades": [
                "2 habitaciones",
                "Cocina equipada",
                "Jardín privado",
                "Parrilla",
                "Zona de juegos infantiles",
                "Aire acondicionado",
                "WiFi",
                "Lavadora",
            ],
        },
    ]

    room_type_objs: list[RoomType] = []
    for rt_data in room_types_data:
        rt = RoomType(hotel_id=hotel.id, **rt_data)
        db.add(rt)
        room_type_objs.append(rt)

    await db.flush()

    # ── Physical rooms (2–3 por tipo) ─────────────────────────────────
    rooms_config = [
        # (room_type_index, numero, piso)
        (0, "101", 1), (0, "102", 1), (0, "103", 1),
        (1, "201", 2), (1, "202", 2),
        (2, "301", 3), (2, "302", 3),
        (3, "401", 1), (3, "402", 1),
    ]
    for rt_idx, numero, piso in rooms_config:
        db.add(Room(
            room_type_id=room_type_objs[rt_idx].id,
            numero=numero,
            piso=piso,
            estado="disponible",
            activo=True,
        ))

    # ── Rate plans ────────────────────────────────────────────────────
    plans_data = [
        {
            "nombre": "Solo Hospedaje",
            "descripcion": "Descanso puro. Incluye WiFi, piscina y parqueo.",
            "costo_extra_adulto": 0.00,
            "costo_extra_nino": 0.00,
            "incluye_desayuno": False,
        },
        {
            "nombre": "Desayuno Incluido",
            "descripcion": "Desayuno típico costarricense con frutas de la finca y café local.",
            "costo_extra_adulto": 18.00,
            "costo_extra_nino": 9.00,
            "incluye_desayuno": True,
        },
        {
            "nombre": "Todo Incluido",
            "descripcion": "La experiencia completa: desayuno, almuerzo, cena, tour de naturaleza y traslado.",
            "costo_extra_adulto": 55.00,
            "costo_extra_nino": 28.00,
            "incluye_desayuno": True,
        },
    ]
    for p in plans_data:
        db.add(RateAndPlan(hotel_id=hotel.id, **p))

    # ── Addons ────────────────────────────────────────────────────────
    addons_data = [
        {
            "nombre": "Tour de naturaleza guiado",
            "descripcion": "Caminata de 3 horas por senderos de bosque primario con guía local certificado.",
            "precio": 35.00,
            "tipo_cobro": "por_persona",
        },
        {
            "nombre": "Traslado aeropuerto",
            "descripcion": "Servicio privado Juan Santamaría ↔ Hotel (ida o vuelta).",
            "precio": 75.00,
            "tipo_cobro": "fijo",
        },
        {
            "nombre": "Botella de vino de bienvenida",
            "descripcion": "Vino tinto o blanco nacional con tabla de quesos al llegar.",
            "precio": 28.00,
            "tipo_cobro": "fijo",
        },
        {
            "nombre": "Masaje relajante 60 min",
            "descripcion": "Masaje de cuerpo completo con aceites esenciales de plantas medicinales locales.",
            "precio": 65.00,
            "tipo_cobro": "por_persona",
        },
    ]
    for a in addons_data:
        db.add(Addon(hotel_id=hotel.id, **a))

    # ── Seasons ───────────────────────────────────────────────────────
    seasons_data = [
        {
            "nombre": "Semana Santa 2026",
            "fecha_inicio": date(2026, 4, 1),
            "fecha_fin": date(2026, 4, 12),
            "multiplicador": 1.35,
        },
        {
            "nombre": "Temporada Alta Navidad",
            "fecha_inicio": date(2025, 12, 20),
            "fecha_fin": date(2026, 1, 5),
            "multiplicador": 1.40,
        },
        {
            "nombre": "Vacaciones Julio",
            "fecha_inicio": date(2026, 7, 1),
            "fecha_fin": date(2026, 7, 31),
            "multiplicador": 1.20,
        },
    ]
    for s in seasons_data:
        db.add(Season(hotel_id=hotel.id, **s))

    await db.commit()
    print(f"Seed complete — hotel_id={hotel.id}")
    print(f"  Admin login: admin@hotelparaisoverde.cr / Admin1234!")
    print(f"  {len(room_types_data)} room types, {len(rooms_config)} rooms")
    print(f"  {len(plans_data)} plans, {len(addons_data)} addons, {len(seasons_data)} seasons")


async def main() -> None:
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as db:
        await seed(db)
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
