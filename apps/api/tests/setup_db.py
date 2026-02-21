"""テスト用DBセットアップ — テーブル作成"""

import asyncio

from src.database import engine
from src.models import Base  # noqa: F401 — 全モデルをBase.metadataに登録


async def main():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()
    print("All tables created successfully.")


if __name__ == "__main__":
    asyncio.run(main())
