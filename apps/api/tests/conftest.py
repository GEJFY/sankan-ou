"""Test fixtures"""

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from src.config import settings
from src.database import get_db
from src.main import create_app


# テスト用エンジン: NullPoolでイベントループ間の接続プール問題を回避
_test_engine = create_async_engine(settings.database_url, poolclass=NullPool)
_test_session_factory = async_sessionmaker(_test_engine, class_=AsyncSession, expire_on_commit=False)


async def _override_get_db():
    """テスト用DBセッション（NullPool使用）"""
    async with _test_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
def app():
    """テスト用FastAPIアプリケーション（DB依存をオーバーライド）"""
    application = create_app()
    application.dependency_overrides[get_db] = _override_get_db
    return application


@pytest.fixture
async def client(app):
    """テスト用非同期HTTPクライアント"""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
