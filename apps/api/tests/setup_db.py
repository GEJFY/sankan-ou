"""テスト用DBセットアップ — テーブル作成（独立エンジン使用）"""

import asyncio
import os

from sqlalchemy.ext.asyncio import create_async_engine

from src.models import Base  # noqa: F401 — 全モデルをBase.metadataに登録


async def main():
    url = os.environ["DATABASE_URL"]
    engine = create_async_engine(url)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()
    print("All tables created successfully.")


if __name__ == "__main__":
    asyncio.run(main())
