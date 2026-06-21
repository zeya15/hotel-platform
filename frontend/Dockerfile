FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS dev
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000

FROM base AS builder
# NEXT_PUBLIC_* vars are inlined into the client bundle at build time.
# Default API URL is empty → browser uses same-origin relative /api (proxied by Caddy).
ARG NEXT_PUBLIC_API_URL=""
ARG NEXT_PUBLIC_HOTEL_ID="1"
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_HOTEL_ID=$NEXT_PUBLIC_HOTEL_ID
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
