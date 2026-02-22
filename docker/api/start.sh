#!/bin/bash
set -e

echo "=== Running Alembic migrations ==="
alembic upgrade head

echo "=== Seeding database ==="
python -m seed.seed_db || echo "WARNING: Seed skipped (may already exist)"

echo "=== Starting API server ==="
exec uvicorn src.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --workers "${WORKERS:-2}" \
    --log-level info \
    --access-log
