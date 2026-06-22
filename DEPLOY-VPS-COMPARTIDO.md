# Deploy en VPS COMPARTIDO (junto a Data Shop)

El VPS `217.216.87.116` ya hostea **Data Shop** con un **nginx** (contenedor
`data-shop-nginx-1`) que ocupa los puertos 80/443 y termina TLS con certbot.

Por eso el hotel **no** usa su propio Caddy en 80/443. En su lugar:

```
ONVO / navegador
      │  HTTPS  hotel.217-216-87-116.nip.io
      ▼
[ nginx de Data Shop ]  ← termina TLS (certbot)
      │  HTTP  (proxy_pass)
      ▼
[ Caddy del hotel :8081 ]  ← split /api → backend, resto → frontend
      ├── frontend (Next.js)
      └── backend  (FastAPI)  ← recibe el webhook de ONVO
```

> ⚠️ **Regla de oro:** no modifiques los `server` existentes de Data Shop.
> Solo se **agrega** un server block nuevo para el hostname del hotel y se
> recarga con `nginx -t && nginx -s reload`.

---

## Parte 1 — Levantar el hotel (no toca a Data Shop)

```bash
cd /root && git clone https://github.com/zeya15/hotel-platform.git && cd hotel-platform

PGPW=$(openssl rand -hex 24); SECRET=$(openssl rand -hex 32)

cat > .env <<EOF
POSTGRES_DB=hoteldb
POSTGRES_USER=hoteluser
POSTGRES_PASSWORD=$PGPW
NEXT_PUBLIC_HOTEL_ID=1
EOF

cat > backend/.env <<EOF
DATABASE_URL=postgresql+asyncpg://hoteluser:$PGPW@postgres:5432/hoteldb
DATABASE_URL_SYNC=postgresql://hoteluser:$PGPW@postgres:5432/hoteldb
REDIS_URL=redis://redis:6379/0
SECRET_KEY=$SECRET
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=30
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2
ONVO_SECRET_KEY=<tu_onvo_secret_key>          # del panel de ONVO — NUNCA al repo
ONVO_API_KEY=<tu_onvo_publishable_key>
ONVO_WEBHOOK_SECRET=<tu_onvo_webhook_secret>
ONVO_BASE_URL=https://api.onvopay.com
EMAILS_FROM_NAME=Hotel Paraiso Verde
EMAILS_FROM_EMAIL=reservas@hotelparaisoverde.cr
EXCHANGE_RATE_BASE_CURRENCY=USD
ENVIRONMENT=production
DEBUG=false
ALLOWED_ORIGINS=["https://hotel.217-216-87-116.nip.io"]
BOOKING_LOCK_TTL_SECONDS=900
AVAILABILITY_RATE_LIMIT=60/minute
EOF

docker compose -f docker-compose.shared.yml up -d --build
```

Verifica que el Caddy interno responde en el host (HTTP, sin TLS todavía):

```bash
curl -I http://127.0.0.1:8081/                       # → 200 (landing)
curl -s http://127.0.0.1:8081/api/v1/rooms/types?hotel_id=1 | head -c 200   # → JSON
```

Si eso responde, el hotel ya está arriba; solo falta el proxy + TLS.

---

## Parte 2 — Integrarlo al nginx de Data Shop (lo aplica quien maneja Data Shop)

### Cómo alcanza el nginx al Caddy del hotel

- **Si el nginx corre en el host:** `proxy_pass http://127.0.0.1:8081;`
- **Si el nginx está en contenedor** (este caso, `data-shop-nginx-1`): `127.0.0.1`
  apunta al propio contenedor, no al host. Usa **una** de estas:
  - IP del bridge del host: `proxy_pass http://172.17.0.1:8081;`
    (verifica con `ip addr show docker0`)
  - **O** conecta el Caddy del hotel a la red del nginx y usa el nombre:
    ```bash
    # nombre de la red del nginx de Data Shop:
    docker inspect data-shop-nginx-1 -f '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}'
    # conecta el caddy del hotel a esa red:
    docker network connect <esa-red> hotel-caddy
    ```
    y luego `proxy_pass http://hotel-caddy:80;`

### Server block nuevo (NO tocar los de Data Shop)

Crea `/etc/nginx/conf.d/hotel.conf` (o donde monte sus conf el contenedor nginx):

```nginx
server {
    listen 80;
    server_name hotel.217-216-87-116.nip.io;

    location / {
        proxy_pass http://172.17.0.1:8081;   # ajustar según lo de arriba
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Valida y recarga **sin tumbar Data Shop**:

```bash
nginx -t && nginx -s reload
```

### Certificado TLS para el hostname del hotel

`hotel.217-216-87-116.nip.io` resuelve a la IP (nip.io soporta subdominios).
Emití el cert con el certbot que ya usa Data Shop:

```bash
certbot --nginx -d hotel.217-216-87-116.nip.io
```

certbot agrega automáticamente el bloque `listen 443 ssl` con las rutas del
cert y la redirección 80→443. Recargá nginx de nuevo si hace falta.

---

## Parte 3 — Probar el flujo completo

1. Abre `https://hotel.217-216-87-116.nip.io` → debe cargar con candado (HTTPS válido).
2. Haz una reserva hasta el pago → **Tarjeta (ONVO)** → redirige a `checkout.onvopay.com`.
3. El webhook ya está registrado en ONVO apuntando a
   `https://217-216-87-116.nip.io/api/v1/payments/onvo/webhook`.

   > ⚠️ OJO: el webhook quedó registrado al hostname **sin** el prefijo `hotel.`
   > (`217-216-87-116.nip.io`), que es el de **Data Shop**. Para que el webhook
   > llegue al hotel hay que **una** de estas:
   >  - Cambiar la URL del webhook en el panel de ONVO a
   >    `https://hotel.217-216-87-116.nip.io/api/v1/payments/onvo/webhook`, **o**
   >  - Que el nginx de Data Shop enrute esa ruta `/api/v1/payments/onvo/webhook`
   >    del host raíz hacia el Caddy del hotel (más enredado).
   >
   > Lo limpio es **actualizar la URL del webhook en ONVO** al hostname `hotel.`.
```
