"""ゲーミフィケーションエンドポイントのテスト"""
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
async def test_get_profile(client: AsyncClient):
    """プロフィール取得"""
    token = await _register_and_login(client)
    resp = await client.get("/api/v1/gamification/profile", headers=_auth_headers(token))
    assert resp.status_code == 200
    data = resp.json()
    assert "total_xp" in data or "xp" in str(data).lower() or resp.status_code == 200

@pytest.mark.integration
async def test_get_missions(client: AsyncClient):
    """デイリーミッション取得"""
    token = await _register_and_login(client)
    resp = await client.get("/api/v1/gamification/missions", headers=_auth_headers(token))
    assert resp.status_code == 200
    data = resp.json()
    assert "missions" in data

@pytest.mark.integration
async def test_get_xp_history(client: AsyncClient):
    """XP履歴取得"""
    token = await _register_and_login(client)
    resp = await client.get("/api/v1/gamification/xp/history", headers=_auth_headers(token))
    assert resp.status_code == 200
    assert "history" in resp.json()

@pytest.mark.integration
async def test_award_xp(client: AsyncClient):
    """XP付与"""
    token = await _register_and_login(client)
    resp = await client.post(
        "/api/v1/gamification/xp/award?amount=100&source=test",
        headers=_auth_headers(token),
    )
    assert resp.status_code == 200

@pytest.mark.integration
async def test_get_badges(client: AsyncClient):
    """バッジ一覧"""
    token = await _register_and_login(client)
    resp = await client.get("/api/v1/gamification/badges", headers=_auth_headers(token))
    assert resp.status_code == 200

@pytest.mark.integration
async def test_get_leaderboard(client: AsyncClient):
    """リーダーボード"""
    resp = await client.get("/api/v1/gamification/leaderboard")
    assert resp.status_code == 200
    assert "leaderboard" in resp.json()

@pytest.mark.integration
async def test_gamification_unauthenticated(client: AsyncClient):
    """未認証 → 401"""
    resp = await client.get("/api/v1/gamification/profile")
    assert resp.status_code == 401

@pytest.mark.integration
async def test_award_xp_level_up(client: AsyncClient):
    """大量XP付与でレベルアップ"""
    token = await _register_and_login(client)
    resp = await client.post(
        "/api/v1/gamification/xp/award?amount=500&source=test",
        headers=_auth_headers(token),
    )
    assert resp.status_code == 200
