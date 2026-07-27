#!/bin/bash
set -e

echo "=== Running Alembic migrations ==="
# migrate.py wraps `alembic upgrade head` in a Postgres advisory lock so
# that if this container is ever scaled to --min-replicas/--max-replicas > 1
# (see deploy.sh), only one replica performs the upgrade at a time; other
# replicas booting concurrently block on the same lock and then see a safe
# no-op once they acquire it. See docker/api/migrate.py for details.
python migrate.py

echo "=== Seeding database ==="
python -m seed.seed_db || echo "WARNING: Seed skipped (may already exist)"

echo "=== Starting API server ==="
exec uvicorn src.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --workers "${WORKERS:-2}" \
    --log-level info \
    --access-log
