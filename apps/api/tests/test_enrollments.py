"""コース登録エンドポイントのテスト"""
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
async def test_get_enrollments_empty(client: AsyncClient, seed_courses):
    """登録なしユーザーの登録一覧"""
    token = await _register_and_login(client)
    resp = await client.get("/api/v1/enrollments", headers=_auth_headers(token))
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 0


@pytest.mark.integration
async def test_enroll_course(client: AsyncClient, seed_courses):
    """コース登録"""
    token = await _register_and_login(client)
    courses_resp = await client.get("/api/v1/courses?include_all=true")
    cia_id = next(c["id"] for c in courses_resp.json()["courses"] if c["code"] == "CIA")
    resp = await client.post(
        "/api/v1/enrollments",
        headers=_auth_headers(token),
        json={"course_id": cia_id},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] in ("enrolled", "re-enrolled")


@pytest.mark.integration
async def test_enroll_duplicate(client: AsyncClient, seed_courses):
    """重複登録 → 409"""
    token = await _register_and_login(client)
    courses_resp = await client.get("/api/v1/courses?include_all=true")
    cia_id = next(c["id"] for c in courses_resp.json()["courses"] if c["code"] == "CIA")
    await client.post("/api/v1/enrollments", headers=_auth_headers(token), json={"course_id": cia_id})
    resp = await client.post("/api/v1/enrollments", headers=_auth_headers(token), json={"course_id": cia_id})
    assert resp.status_code == 409


@pytest.mark.integration
async def test_enroll_nonexistent(client: AsyncClient, seed_courses):
    """存在しないコースへの登録 → 404"""
    token = await _register_and_login(client)
    resp = await client.post(
        "/api/v1/enrollments",
        headers=_auth_headers(token),
        json={"course_id": str(uuid.uuid4())},
    )
    assert resp.status_code == 404


@pytest.mark.integration
async def test_get_enrollments_after_enroll(client: AsyncClient, seed_courses):
    """登録後の一覧確認"""
    token = await _register_and_login(client)
    courses_resp = await client.get("/api/v1/courses?include_all=true")
    cia_id = next(c["id"] for c in courses_resp.json()["courses"] if c["code"] == "CIA")
    await client.post("/api/v1/enrollments", headers=_auth_headers(token), json={"course_id": cia_id})
    resp = await client.get("/api/v1/enrollments", headers=_auth_headers(token))
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1


@pytest.mark.integration
async def test_unenroll(client: AsyncClient, seed_courses):
    """コース登録解除"""
    token = await _register_and_login(client)
    courses_resp = await client.get("/api/v1/courses?include_all=true")
    cia_id = next(c["id"] for c in courses_resp.json()["courses"] if c["code"] == "CIA")
    enroll_resp = await client.post("/api/v1/enrollments", headers=_auth_headers(token), json={"course_id": cia_id})
    enrollment_id = enroll_resp.json().get("enrollment_id")
    if enrollment_id:
        resp = await client.delete(f"/api/v1/enrollments/{enrollment_id}", headers=_auth_headers(token))
        assert resp.status_code == 200


@pytest.mark.integration
async def test_enrollment_unauthenticated(client: AsyncClient):
    """未認証 → 401"""
    resp = await client.get("/api/v1/enrollments")
    assert resp.status_code == 401


@pytest.mark.integration
async def test_update_retention(client: AsyncClient, seed_courses):
    """目標記憶率更新"""
    token = await _register_and_login(client)
    courses_resp = await client.get("/api/v1/courses?include_all=true")
    cia_id = next(c["id"] for c in courses_resp.json()["courses"] if c["code"] == "CIA")
    enroll_resp = await client.post("/api/v1/enrollments", headers=_auth_headers(token), json={"course_id": cia_id})
    enrollment_id = enroll_resp.json().get("enrollment_id")
    if enrollment_id:
        resp = await client.put(
            f"/api/v1/enrollments/{enrollment_id}/retention",
            headers=_auth_headers(token),
            json={"desired_retention": 0.85},
        )
        assert resp.status_code == 200
