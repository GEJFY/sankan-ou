#!/usr/bin/env python3
"""Run `alembic upgrade head` guarded by a Postgres advisory lock.

Why this exists
----------------
Alembic's own bookkeeping (a single-row ``alembic_version`` table) does not
make concurrent ``alembic upgrade head`` invocations safe across multiple
replicas. ``docker/api/start.sh`` runs this on every container boot, and if
the API Container App is ever scaled to more than one replica
(``az containerapp update --min-replicas/--max-replicas`` > 1, see
``deploy.sh``), several replicas can boot at the same time. Each would then
read the same "current" alembic version and race to apply the same
migration's DDL (e.g. two concurrent ``CREATE TABLE``/``ALTER TABLE``
statements), which can error out or interleave unpredictably.

``pg_advisory_lock`` is a session-level, application-defined mutex backed by
Postgres itself: every replica blocks on the same lock key before running
``alembic upgrade head``, so only one replica actually performs the upgrade
at a time. The others block, then acquire the lock only after the first has
committed its migrations and released it - at which point
``alembic upgrade head`` is a safe no-op (already at head).

This reuses the app's own SQLAlchemy async engine (``src.database.engine``)
so the DB connection/SSL handling (e.g. Azure Postgres's ``?ssl=require``)
is identical to the rest of the app instead of being re-implemented here.
"""

import asyncio
import subprocess
import sys

from sqlalchemy import text

from src.database import engine

# Arbitrary fixed lock key dedicated to this app's schema migrations. Any
# 64-bit integer works as long as it stays the same across replicas/runs.
MIGRATION_LOCK_KEY = 891_234_567


async def _run_locked() -> int:
    async with engine.connect() as conn:
        await conn.execute(text("SELECT pg_advisory_lock(:key)"), {"key": MIGRATION_LOCK_KEY})
        try:
            result = subprocess.run(["alembic", "upgrade", "head"])
            return result.returncode
        finally:
            await conn.execute(text("SELECT pg_advisory_unlock(:key)"), {"key": MIGRATION_LOCK_KEY})


def main() -> int:
    return asyncio.run(_run_locked())


if __name__ == "__main__":
    sys.exit(main())
