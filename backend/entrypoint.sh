#!/bin/sh
set -e

echo "Running database migrations..."
alembic upgrade head

echo "Seeding demo data..."
python -m app.seeds.seed

echo "Starting server..."
exec "$@"
