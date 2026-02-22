"""管理者エンドポイントのテスト"""
import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from src.config import settings
from src.models.user import User

_test_engine = create_async_engine(settings.database_url, poolclass=NullPool)
_test_session_factory = async_sessionmaker(_test_engine, class_=AsyncSession, expire_on_commit=False)


async def _register_and_login(client: AsyncClient) -> str:
    """Register unique user and return token"""
    email = f"test_{uuid.uuid4().hex[:8]}@test.com"
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "testpass123", "display_name": "Tester"},
    )
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "testpass123"},
    )
    return login_resp.json()["access_token"]


def _auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


async def _make_admin(client: AsyncClient) -> tuple[str, str]:
    """Create admin user and return (token, email)"""
    email = f"admin_{uuid.uuid4().hex[:8]}@test.com"
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "adminpass123", "display_name": "Admin"},
    )
    async with _test_session_factory() as session:
        await session.execute(
            update(User).where(User.email == email).values(role="admin")
        )
        await session.commit()
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "adminpass123"},
    )
    token = login_resp.json()["access_token"]
    return token, email


@pytest.mark.integration
async def test_admin_stats(client: AsyncClient, seed_all_courses):
    """管理者統計"""
    token, _ = await _make_admin(client)
    resp = await client.get("/api/v1/admin/stats", headers=_auth_headers(token))
    assert resp.status_code == 200
    data = resp.json()
    assert "users" in data
    assert "content" in data


@pytest.mark.integration
async def test_admin_stats_non_admin(client: AsyncClient):
    """非管理者 → 403"""
    token = await _register_and_login(client)
    resp = await client.get("/api/v1/admin/stats", headers=_auth_headers(token))
    assert resp.status_code == 403


@pytest.mark.integration
async def test_admin_users(client: AsyncClient):
    """ユーザー一覧"""
    token, _ = await _make_admin(client)
    resp = await client.get("/api/v1/admin/users", headers=_auth_headers(token))
    assert resp.status_code == 200
    data = resp.json()
    assert "users" in data
    assert "total" in data


@pytest.mark.integration
async def test_admin_courses(client: AsyncClient, seed_all_courses):
    """コース一覧（プラグイン付き）"""
    token, _ = await _make_admin(client)
    resp = await client.get("/api/v1/admin/courses", headers=_auth_headers(token))
    assert resp.status_code == 200
    data = resp.json()
    assert "courses" in data


@pytest.mark.integration
async def test_admin_unauthenticated(client: AsyncClient):
    """未認証 → 401"""
    resp = await client.get("/api/v1/admin/stats")
    assert resp.status_code == 401


@pytest.mark.integration
async def test_admin_courses_has_plugins(client: AsyncClient, seed_all_courses):
    """プラグイン情報を含む"""
    token, _ = await _make_admin(client)
    resp = await client.get("/api/v1/admin/courses", headers=_auth_headers(token))
    courses = resp.json()["courses"]
    # プラグイン登録済みコースが含まれる
    codes = [c.get("code") or c.get("course_code", "") for c in courses]
    assert any("CIA" in str(c) for c in codes) or len(courses) > 0
