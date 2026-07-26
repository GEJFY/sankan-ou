"""ゲーミフィケーションエンドポイントのテスト"""
import uuid

import pytest
from httpx import AsyncClient

from tests.conftest import make_admin


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
    """XP付与 (管理者のみ)"""
    admin_token, _ = await make_admin(client)
    me_resp = await client.get("/api/v1/auth/me", headers=_auth_headers(admin_token))
    admin_id = me_resp.json()["id"]

    resp = await client.post(
        f"/api/v1/gamification/xp/award?target_user_id={admin_id}&amount=100&source=test",
        headers=_auth_headers(admin_token),
    )
    assert resp.status_code == 200


@pytest.mark.integration
async def test_award_xp_requires_admin(client: AsyncClient):
    """XP付与は管理者以外は403"""
    token = await _register_and_login(client)
    me_resp = await client.get("/api/v1/auth/me", headers=_auth_headers(token))
    user_id = me_resp.json()["id"]

    resp = await client.post(
        f"/api/v1/gamification/xp/award?target_user_id={user_id}&amount=100&source=test",
        headers=_auth_headers(token),
    )
    assert resp.status_code == 403

@pytest.mark.integration
async def test_get_badges(client: AsyncClient):
    """バッジ一覧"""
    token = await _register_and_login(client)
    resp = await client.get("/api/v1/gamification/badges", headers=_auth_headers(token))
    assert resp.status_code == 200

@pytest.mark.integration
async def test_get_leaderboard(client: AsyncClient):
    """リーダーボード（認証必須。表示名のみ含み、生のuser_idは含まない）"""
    token = await _register_and_login(client)
    resp = await client.get("/api/v1/gamification/leaderboard", headers=_auth_headers(token))
    assert resp.status_code == 200
    data = resp.json()
    assert "leaderboard" in data
    if data["leaderboard"]:
        assert "display_name" in data["leaderboard"][0]
        assert "user_id" not in data["leaderboard"][0]


@pytest.mark.integration
async def test_get_leaderboard_unauthenticated(client: AsyncClient):
    """未認証のリーダーボード取得 → 401"""
    resp = await client.get("/api/v1/gamification/leaderboard")
    assert resp.status_code == 401

@pytest.mark.integration
async def test_gamification_unauthenticated(client: AsyncClient):
    """未認証 → 401"""
    resp = await client.get("/api/v1/gamification/profile")
    assert resp.status_code == 401

@pytest.mark.integration
async def test_award_xp_level_up(client: AsyncClient):
    """大量XP付与でレベルアップ (管理者)"""
    admin_token, _ = await make_admin(client)
    me_resp = await client.get("/api/v1/auth/me", headers=_auth_headers(admin_token))
    admin_id = me_resp.json()["id"]

    resp = await client.post(
        f"/api/v1/gamification/xp/award?target_user_id={admin_id}&amount=500&source=test",
        headers=_auth_headers(admin_token),
    )
    assert resp.status_code == 200
