"""セッション・予測エンドポイントのテスト"""
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
async def test_start_session(client: AsyncClient, seed_all_courses):
    """セッション開始"""
    token = await _register_and_login(client)
    course_ids = seed_all_courses
    resp = await client.post(
        "/api/v1/sessions/start",
        headers=_auth_headers(token),
        json={"course_id": str(course_ids["CIA"]), "session_type": "review"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "session_id" in data

@pytest.mark.integration
async def test_end_session(client: AsyncClient, seed_all_courses):
    """セッション終了"""
    token = await _register_and_login(client)
    course_ids = seed_all_courses
    start_resp = await client.post(
        "/api/v1/sessions/start",
        headers=_auth_headers(token),
        json={"course_id": str(course_ids["CIA"]), "session_type": "review"},
    )
    session_id = start_resp.json()["session_id"]
    resp = await client.post(
        "/api/v1/sessions/end",
        headers=_auth_headers(token),
        json={"session_id": session_id, "cards_reviewed": 5, "cards_correct": 4},
    )
    assert resp.status_code == 200

@pytest.mark.integration
async def test_recent_sessions(client: AsyncClient, seed_all_courses):
    """最近のセッション"""
    token = await _register_and_login(client)
    resp = await client.get("/api/v1/sessions/recent", headers=_auth_headers(token))
    assert resp.status_code == 200
    assert "sessions" in resp.json()

@pytest.mark.integration
async def test_today_stats(client: AsyncClient, seed_all_courses):
    """今日の統計"""
    token = await _register_and_login(client)
    resp = await client.get("/api/v1/sessions/today", headers=_auth_headers(token))
    assert resp.status_code == 200

@pytest.mark.integration
async def test_prediction(client: AsyncClient, seed_all_courses):
    """合格予測"""
    token = await _register_and_login(client)
    course_ids = seed_all_courses
    resp = await client.get(
        f"/api/v1/predictions/{course_ids['CIA']}",
        headers=_auth_headers(token),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "predicted_score" in data
    assert "pass_probability" in data

@pytest.mark.integration
async def test_roi(client: AsyncClient, seed_all_courses):
    """学習ROI"""
    token = await _register_and_login(client)
    course_ids = seed_all_courses
    resp = await client.get(
        f"/api/v1/predictions/{course_ids['CIA']}/roi",
        headers=_auth_headers(token),
    )
    assert resp.status_code == 200

@pytest.mark.integration
async def test_mastery(client: AsyncClient, seed_all_courses):
    """トピック習熟度"""
    token = await _register_and_login(client)
    course_ids = seed_all_courses
    resp = await client.get(
        f"/api/v1/mastery/{course_ids['CIA']}",
        headers=_auth_headers(token),
    )
    assert resp.status_code == 200

@pytest.mark.integration
async def test_session_unauthenticated(client: AsyncClient):
    """未認証 → 401"""
    resp = await client.post("/api/v1/sessions/start", json={"course_id": "00000000-0000-0000-0000-000000000001"})
    assert resp.status_code == 401
