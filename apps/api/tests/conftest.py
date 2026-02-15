"""Test fixtures"""

import pytest
from httpx import ASGITransport, AsyncClient

from src.main import create_app


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
def app():
    """テスト用FastAPIアプリケーション"""
    return create_app()


@pytest.fixture
async def client(app):
    """テスト用非同期HTTPクライアント"""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
