"""認証エンドポイントのテスト"""

import pytest
from httpx import AsyncClient


@pytest.mark.integration
async def test_register_success(client: AsyncClient):
    """正常なユーザー登録"""
    resp = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "testpass123",
            "display_name": "Test User",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "test@example.com"
    assert data["display_name"] == "Test User"
    assert data["role"] == "learner"
    assert "id" in data


@pytest.mark.integration
async def test_register_duplicate_email(client: AsyncClient):
    """重複メールアドレスで登録失敗"""
    payload = {
        "email": "dup@example.com",
        "password": "testpass123",
        "display_name": "User 1",
    }
    resp1 = await client.post("/api/v1/auth/register", json=payload)
    assert resp1.status_code == 201

    payload["display_name"] = "User 2"
    resp2 = await client.post("/api/v1/auth/register", json=payload)
    assert resp2.status_code == 409


@pytest.mark.integration
async def test_login_success(client: AsyncClient):
    """正常なログイン"""
    # 登録
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "login@example.com",
            "password": "testpass123",
            "display_name": "Login User",
        },
    )

    # ログイン
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "login@example.com", "password": "testpass123"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.integration
async def test_login_wrong_password(client: AsyncClient):
    """不正パスワードでログイン失敗"""
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "wrong@example.com",
            "password": "testpass123",
            "display_name": "Wrong User",
        },
    )

    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "wrong@example.com", "password": "wrongpass"},
    )
    assert resp.status_code == 401


@pytest.mark.integration
async def test_get_me_with_valid_token(client: AsyncClient):
    """有効トークンで /auth/me 成功"""
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "me@example.com",
            "password": "testpass123",
            "display_name": "Me User",
        },
    )
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "me@example.com", "password": "testpass123"},
    )
    token = login_resp.json()["access_token"]

    resp = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "me@example.com"
    assert data["display_name"] == "Me User"


@pytest.mark.integration
async def test_get_me_without_token(client: AsyncClient):
    """トークンなしで /auth/me → 401"""
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 401


@pytest.mark.integration
async def test_get_me_with_invalid_token(client: AsyncClient):
    """無効トークンで /auth/me → 401"""
    resp = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid_token_here"},
    )
    assert resp.status_code == 401


@pytest.mark.integration
async def test_protected_route_requires_auth(client: AsyncClient):
    """保護ルート (/cards/due) はトークンなしで 401"""
    resp = await client.get("/api/v1/cards/due")
    assert resp.status_code == 401


@pytest.mark.integration
async def test_protected_route_with_auth(client: AsyncClient):
    """保護ルート (/dashboard/summary) はトークンありで 200"""
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "protected@example.com",
            "password": "testpass123",
            "display_name": "Protected User",
        },
    )
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "protected@example.com", "password": "testpass123"},
    )
    token = login_resp.json()["access_token"]

    resp = await client.get(
        "/api/v1/dashboard/summary",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
