---
name: hotel-platform
description: "Skill maestro del proyecto Hotel Platform. Úsala para tareas recurrentes del proyecto: levantar el stack, correr migraciones, crear datos de prueba, revisar el estado del booking engine, generar un nuevo módulo, o hacer un audit SEO del cliente. Triggers: 'levanta el stack', 'corre las migraciones', 'crea datos de prueba', 'status del proyecto', 'nuevo módulo', 'audit seo del hotel', 'genera seed data', 'revisa el booking engine', 'hotel platform'."
---

# Hotel Platform — Skill Maestro

Automatiza las tareas recurrentes del proyecto Hotel Platform (FastAPI + Next.js + PostgreSQL + Redis).

**Regla fundamental: siempre trabajar dentro de `hotel-platform/`.**

---

## Comando: levantar el stack local

```bash
cd hotel-platform
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
docker-compose up --build
```

Verifica que los servicios están up:
- API: http://localhost:8000/health
- Docs: http://localhost:8000/api/docs
- Frontend: http://localhost:3000

---

## Comando: correr migraciones

```bash
cd hotel-platform/backend
DATABASE_URL_SYNC=postgresql://hoteluser:hotelpass@localhost:5432/hoteldb alembic upgrade head
```

Para crear una nueva migración:
```bash
alembic revision --autogenerate -m "descripcion_del_cambio"
```

---

## Comando: seed data (hotel de prueba)

Genera un script Python que inserte en la DB:
1. Un hotel de prueba (`Hotel Paraíso`, moneda USD, zona horaria America/Costa_Rica)
2. 3 tipos de habitación (Standard, Deluxe, Suite) con precios distintos
3. 2-3 habitaciones físicas por tipo
4. 2 planes (Solo Habitación, Todo Incluido)
5. 3 addons (Transporte aeropuerto, Tour Canopy, Botella de vino)
6. 1 temporada alta (diciembre-enero, multiplicador 1.4)
7. Un usuario admin y un usuario huésped de prueba

Guárdalo en `hotel-platform/backend/scripts/seed.py` y ejecútalo con:
```bash
cd hotel-platform/backend
python scripts/seed.py
```

---

## Comando: status del booking engine

Verifica el estado actual del motor de reservas:
1. Lee `app/services/booking_engine.py` y `app/services/pricing.py`
2. Verifica que los locks en Redis tienen el TTL correcto
3. Muestra las transiciones de estado válidas del VALID_TRANSITIONS dict
4. Lista las Celery tasks registradas en `app/tasks/booking_tasks.py`

---

## Comando: nuevo módulo API

Cuando el usuario pida añadir un nuevo módulo (ej. "añade gestión de reviews"):

1. Crea el modelo en `backend/app/models/[nombre].py`
2. Añade el import en `backend/app/models/__init__.py`
3. Crea el schema en `backend/app/schemas/[nombre].py`
4. Crea el endpoint en `backend/app/api/v1/endpoints/[nombre].py`
5. Registra el router en `backend/app/api/v1/router.py`
6. Genera una migración Alembic con `alembic revision --autogenerate`
7. Actualiza el CLAUDE.md con el nuevo módulo

---

## Comando: audit SEO del cliente

Usa la skill `auditoria-seo` en el frontend client:
- URL a auditar: http://localhost:3000
- Foco especial en: meta tags de habitaciones, JSON-LD LodgingBusiness, LCP < 1.5s
- Aplica las correcciones directamente en `frontend/src/app/(client)/`

---

## Comando: revisar seguridad

Usa la skill `security-review` y focaliza en:
- Validación de firma del webhook de Stripe (`app/api/v1/endpoints/payments.py`)
- Filtrado por `hotel_id` en todos los queries (verificar multi-tenancy)
- Constraint de idempotencia en `payments.referencia_externa`
- JWT: verificar que `hotel_id` y `role` se validan en cada endpoint protegido

---

## Estructura clave del proyecto

```
hotel-platform/
├── backend/app/
│   ├── services/booking_engine.py   ← Motor de reservas + locks Redis
│   ├── services/pricing.py          ← Fórmula de precios + temporadas
│   ├── services/payment_service.py  ← Stripe + pagos manuales
│   ├── tasks/booking_tasks.py       ← Celery: expiración locks, emails
│   └── api/v1/endpoints/            ← auth, availability, bookings, payments, rooms
└── frontend/src/
    ├── app/(client)/                ← SSR/SSG para SEO
    ├── app/(admin)/                 ← Dashboard protegido
    └── lib/                         ← api-client, api-server, store/auth
```
