#!/bin/bash
set -e

echo "=== Running Alembic migrations ==="
if ! alembic upgrade head 2>&1; then
    echo "WARNING: Alembic migration failed, using create_all fallback" >&2
fi

echo "=== Starting API server ==="
exec uvicorn src.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --workers "${WORKERS:-2}" \
    --log-level info \
    --access-log
