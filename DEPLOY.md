# Despliegue en el VPS (Contabo + Docker + Caddy)

Guía para poner el Hotel Platform en producción con HTTPS, lista para que ONVO
pueda entregar el webhook de pagos.

**VPS:** Contabo · IP `217.216.87.116` · Docker ya instalado
**Topología:** Caddy (HTTPS) → `/api/*` al backend FastAPI, el resto al frontend Next.js.

---

## 0. Requisitos previos

- Acceso SSH al VPS (`ssh root@217.216.87.116`).
- Puertos **80** y **443** abiertos en el firewall del VPS (Caddy los necesita
  para emitir y servir el certificado TLS).
- Un dominio apuntando al VPS **o** usar `nip.io` (sin comprar nada):
  `217-216-87-116.nip.io`.

---

## 1. Subir el código al VPS

Desde tu máquina, dentro de `hotel-platform/`:

```bash
# Opción A — con git (recomendado si subes el repo a GitHub):
ssh root@217.216.87.116
git clone <tu-repo> hotel-platform && cd hotel-platform

# Opción B — copia directa por SCP/rsync (sin git):
rsync -av --exclude node_modules --exclude .next --exclude .git \
  ./ root@217.216.87.116:/root/hotel-platform/
```

> Los `.env` con secretos **no** se versionan (ya están en `.gitignore`).
> Hay que crearlos en el VPS en el paso siguiente.

---

## 2. Configurar las variables de entorno en el VPS

```bash
cd /root/hotel-platform

# (a) Variables de infraestructura del compose (dominio, DB, ACME):
cp .env.prod.example .env
nano .env
#   DOMAIN=217-216-87-116.nip.io
#   ACME_EMAIL=eitan2729@gmail.com
#   POSTGRES_PASSWORD=<genera una fuerte: openssl rand -hex 24>

# (b) Variables del backend:
cp backend/.env.example backend/.env   # si no lo copiaste ya
nano backend/.env
```

En `backend/.env` ajusta para producción:

- `DATABASE_URL` / `DATABASE_URL_SYNC` → usa **la misma** `POSTGRES_PASSWORD`
  que pusiste en el `.env` raíz.
- `SECRET_KEY` → `openssl rand -hex 32`
- `DEBUG=false` y `ENVIRONMENT=production`
- `ALLOWED_ORIGINS=["https://217-216-87-116.nip.io"]` (formato JSON, lista)
- ONVO (las llaves de prueba ya están puestas):
  - `ONVO_SECRET_KEY=onvo_test_secret_key_...`
  - `ONVO_API_KEY=onvo_test_publishable_key_...`
  - `ONVO_WEBHOOK_SECRET=` → **se rellena en el paso 5**.

---

## 3. Levantar el stack

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Caddy pedirá el certificado a Let's Encrypt automáticamente (tarda ~30s la
primera vez). Verifica:

```bash
docker compose -f docker-compose.prod.yml ps
curl -I https://217-216-87-116.nip.io/health        # → 200 desde el backend vía /api? No: /health no está bajo /api
curl -I https://217-216-87-116.nip.io/api/v1/rooms/types?hotel_id=1   # → 200 JSON
curl -I https://217-216-87-116.nip.io/               # → 200 (landing Next.js)
```

> Nota: `/health` del backend NO está bajo `/api`, así que no pasa por Caddy.
> Para chequear el backend desde fuera usa una ruta `/api/v1/...`.

---

## 4. Verificar la app

Abre en el navegador: `https://217-216-87-116.nip.io`

- Landing, habitaciones, galería → deben cargar con HTTPS válido (candado).
- Haz una reserva de prueba hasta el paso de pago y elige **Tarjeta (ONVO)**:
  debe redirigir a `https://checkout.onvopay.com/pay/...`.

---

## 5. Registrar el webhook de ONVO

Ahora que la plataforma está pública con HTTPS:

1. Entra al panel de ONVO → **Webhooks** → **Agregar endpoint**.
2. URL del endpoint:
   ```
   https://217-216-87-116.nip.io/api/v1/payments/onvo/webhook
   ```
3. Evento: `payment-intent.succeeded`.
4. ONVO te dará un **webhook secret** (`webhook_secret_...`). Cópialo a
   `backend/.env`:
   ```
   ONVO_WEBHOOK_SECRET=webhook_secret_...
   ```
5. Reinicia solo el backend y los workers para tomar la variable:
   ```bash
   docker compose -f docker-compose.prod.yml up -d backend worker-critical worker-notifications
   ```

A partir de aquí, cuando un pago se complete en ONVO, el webhook confirma la
reserva (`PENDING_PAYMENT → CONFIRMED`) y dispara el email de confirmación.

---

## 6. Operación

```bash
# Logs en vivo
docker compose -f docker-compose.prod.yml logs -f backend caddy

# Actualizar tras cambios de código
git pull   # o rsync de nuevo
docker compose -f docker-compose.prod.yml up -d --build

# Reiniciar todo
docker compose -f docker-compose.prod.yml restart

# Backup de la base de datos
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U hoteluser hoteldb > backup_$(date +%F).sql
```

---

## Cambiar a un dominio propio más adelante

1. Apunta un registro `A` del dominio a `217.216.87.116`.
2. En `.env` cambia `DOMAIN=tudominio.com`.
3. `docker compose -f docker-compose.prod.yml up -d caddy` (re-emite el cert).
4. Actualiza la URL del webhook en el panel de ONVO al nuevo dominio.

No hace falta reconstruir el frontend: el navegador llama al API en mismo
origen (`/api`), así que el bundle es independiente del dominio.
