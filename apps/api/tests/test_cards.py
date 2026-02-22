"""カード・レビューエンドポイントのテスト"""
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
async def test_get_due_cards(client: AsyncClient, seed_all_courses):
    """復習カード取得"""
    token = await _register_and_login(client)
    resp = await client.get("/api/v1/cards/due", headers=_auth_headers(token))
    assert resp.status_code == 200
    data = resp.json()
    assert "cards" in data
    assert "total_due" in data


@pytest.mark.integration
async def test_get_due_cards_with_course_filter(client: AsyncClient, seed_all_courses):
    """コースフィルタ付きカード取得"""
    token = await _register_and_login(client)
    course_ids = seed_all_courses
    resp = await client.get(
        f"/api/v1/cards/due?course_id={course_ids['CIA']}",
        headers=_auth_headers(token),
    )
    assert resp.status_code == 200


@pytest.mark.integration
async def test_get_due_cards_with_limit(client: AsyncClient, seed_all_courses):
    """limit付きカード取得"""
    token = await _register_and_login(client)
    resp = await client.get("/api/v1/cards/due?limit=2", headers=_auth_headers(token))
    assert resp.status_code == 200
    assert len(resp.json()["cards"]) <= 2


@pytest.mark.integration
async def test_get_due_cards_unauthenticated(client: AsyncClient):
    """未認証でカード取得 → 401"""
    resp = await client.get("/api/v1/cards/due")
    assert resp.status_code == 401


@pytest.mark.integration
async def test_submit_review(client: AsyncClient, seed_all_courses):
    """レビュー送信"""
    token = await _register_and_login(client)
    # まずカードを取得
    cards_resp = await client.get("/api/v1/cards/due", headers=_auth_headers(token))
    cards = cards_resp.json()["cards"]
    assert len(cards) > 0, "No cards available for review"
    card_id = cards[0]["id"]

    resp = await client.post(
        "/api/v1/cards/review",
        headers=_auth_headers(token),
        json={"card_id": card_id, "rating": 3, "response_time_ms": 5000},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "state" in data
    assert "due" in data
    assert "stability" in data
    assert "next_review_in_hours" in data


@pytest.mark.integration
async def test_submit_review_again(client: AsyncClient, seed_all_courses):
    """Again(1)レーティングでレビュー"""
    token = await _register_and_login(client)
    cards_resp = await client.get("/api/v1/cards/due", headers=_auth_headers(token))
    cards = cards_resp.json()["cards"]
    assert len(cards) > 0
    resp = await client.post(
        "/api/v1/cards/review",
        headers=_auth_headers(token),
        json={"card_id": cards[0]["id"], "rating": 1, "response_time_ms": 3000},
    )
    assert resp.status_code == 200


@pytest.mark.integration
async def test_submit_review_unauthenticated(client: AsyncClient):
    """未認証でレビュー → 401"""
    import uuid
    resp = await client.post(
        "/api/v1/cards/review",
        json={"card_id": str(uuid.uuid4()), "rating": 3, "response_time_ms": 1000},
    )
    assert resp.status_code == 401


@pytest.mark.integration
async def test_submit_review_invalid_rating(client: AsyncClient, seed_all_courses):
    """無効なレーティング → 422"""
    token = await _register_and_login(client)
    import uuid
    resp = await client.post(
        "/api/v1/cards/review",
        headers=_auth_headers(token),
        json={"card_id": str(uuid.uuid4()), "rating": 5, "response_time_ms": 1000},
    )
    assert resp.status_code == 422
