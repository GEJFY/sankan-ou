"""ダッシュボードエンドポイントのテスト"""
import uuid

import pytest
from httpx import AsyncClient


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


@pytest.mark.integration
async def test_dashboard_summary(client: AsyncClient, seed_all_courses):
    """ダッシュボードサマリー取得"""
    token = await _register_and_login(client)
    resp = await client.get("/api/v1/dashboard/summary", headers=_auth_headers(token))
    assert resp.status_code == 200
    data = resp.json()
    assert "courses" in data
    assert "total_studied_today" in data
    assert "streak_days" in data


@pytest.mark.integration
async def test_dashboard_summary_unauthenticated(client: AsyncClient):
    """未認証でサマリー → 401"""
    resp = await client.get("/api/v1/dashboard/summary")
    assert resp.status_code == 401


@pytest.mark.integration
async def test_weak_topics(client: AsyncClient, seed_all_courses):
    """弱点トピック取得"""
    token = await _register_and_login(client)
    resp = await client.get("/api/v1/dashboard/weak-topics", headers=_auth_headers(token))
    assert resp.status_code == 200
    data = resp.json()
    assert "topics" in data


@pytest.mark.integration
async def test_weak_topics_unauthenticated(client: AsyncClient):
    resp = await client.get("/api/v1/dashboard/weak-topics")
    assert resp.status_code == 401


@pytest.mark.integration
async def test_history(client: AsyncClient, seed_all_courses):
    """学習履歴取得"""
    token = await _register_and_login(client)
    resp = await client.get("/api/v1/dashboard/history", headers=_auth_headers(token))
    assert resp.status_code == 200
    data = resp.json()
    assert "history" in data


@pytest.mark.integration
async def test_history_unauthenticated(client: AsyncClient):
    resp = await client.get("/api/v1/dashboard/history")
    assert resp.status_code == 401
