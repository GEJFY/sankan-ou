"""模擬試験エンドポイントのテスト"""

import pytest
from httpx import AsyncClient


async def _register_and_login(client: AsyncClient, email: str) -> str:
    """ヘルパー: ユーザー登録+ログインしてトークンを返す"""
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "testpass123",
            "display_name": "Mock Exam Tester",
        },
    )
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "testpass123"},
    )
    return login_resp.json()["access_token"]


def _auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


async def _get_course_id(client: AsyncClient, code: str) -> str:
    """ヘルパー: コースIDを取得"""
    courses_resp = await client.get("/api/v1/courses?include_all=true")
    courses = courses_resp.json()["courses"]
    course = next((c for c in courses if c["code"] == code), None)
    assert course is not None, f"Course {code} not found. Courses: {[c['code'] for c in courses]}"
    return course["id"]


@pytest.mark.integration
async def test_get_exam_config(client: AsyncClient):
    """試験設定取得"""
    resp = await client.get("/api/v1/mock-exam/config/CIA")
    assert resp.status_code == 200
    data = resp.json()
    assert data["course_code"] == "CIA"
    assert "passing_score" in data
    assert "sections" in data


@pytest.mark.integration
async def test_submit_mock_exam(client: AsyncClient, seed_courses):
    """模擬試験結果の保存"""
    token = await _register_and_login(client, "mockexam1@example.com")
    cia_id = await _get_course_id(client, "CIA")

    resp = await client.post(
        "/api/v1/mock-exam/submit",
        headers=_auth_headers(token),
        json={
            "course_id": cia_id,
            "course_code": "CIA",
            "total_questions": 10,
            "correct_count": 7,
            "passing_score_pct": 60,
            "time_taken_seconds": 300,
            "question_ids": ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10"],
            "answer_indices": [0, 1, 2, 0, 1, 2, 0, 1, 2, 0],
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["course_code"] == "CIA"
    assert data["score_pct"] == 70.0
    assert data["correct_count"] == 7
    assert data["total_questions"] == 10
    assert data["passed"] is True
    assert "id" in data
    assert "created_at" in data


@pytest.mark.integration
async def test_submit_mock_exam_unauthenticated(client: AsyncClient):
    """未認証で模擬試験結果の保存 → 401"""
    resp = await client.post(
        "/api/v1/mock-exam/submit",
        json={
            "course_id": "00000000-0000-0000-0000-000000000001",
            "course_code": "CIA",
            "total_questions": 10,
            "correct_count": 5,
            "passing_score_pct": 60,
            "time_taken_seconds": 300,
            "question_ids": [],
            "answer_indices": [],
        },
    )
    assert resp.status_code == 401


@pytest.mark.integration
async def test_get_mock_exam_history(client: AsyncClient, seed_courses):
    """模擬試験履歴取得"""
    token = await _register_and_login(client, "mockexam2@example.com")
    cia_id = await _get_course_id(client, "CIA")

    # 2件保存
    for correct in [6, 8]:
        await client.post(
            "/api/v1/mock-exam/submit",
            headers=_auth_headers(token),
            json={
                "course_id": cia_id,
                "course_code": "CIA",
                "total_questions": 10,
                "correct_count": correct,
                "passing_score_pct": 60,
                "time_taken_seconds": 200,
                "question_ids": [],
                "answer_indices": [],
            },
        )

    resp = await client.get(
        "/api/v1/mock-exam/history",
        headers=_auth_headers(token),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_count"] == 2
    assert len(data["results"]) == 2
    # 新しい順 (80% が先)
    assert data["results"][0]["score_pct"] == 80.0
    assert data["results"][1]["score_pct"] == 60.0


@pytest.mark.integration
async def test_get_mock_exam_history_filter(client: AsyncClient, seed_courses):
    """模擬試験履歴のコースフィルタ"""
    token = await _register_and_login(client, "mockexam3@example.com")
    cia_id = await _get_course_id(client, "CIA")
    cisa_id = await _get_course_id(client, "CISA")

    # CIA 1件, CISA 1件
    for course_id, course_code in [(cia_id, "CIA"), (cisa_id, "CISA")]:
        await client.post(
            "/api/v1/mock-exam/submit",
            headers=_auth_headers(token),
            json={
                "course_id": course_id,
                "course_code": course_code,
                "total_questions": 10,
                "correct_count": 7,
                "passing_score_pct": 60,
                "time_taken_seconds": 200,
                "question_ids": [],
                "answer_indices": [],
            },
        )

    # フィルタなし → 2件
    resp = await client.get(
        "/api/v1/mock-exam/history",
        headers=_auth_headers(token),
    )
    assert resp.json()["total_count"] == 2

    # CIAフィルタ → 1件
    resp = await client.get(
        "/api/v1/mock-exam/history?course_code=CIA",
        headers=_auth_headers(token),
    )
    data = resp.json()
    assert data["total_count"] == 1
    assert data["results"][0]["course_code"] == "CIA"


@pytest.mark.integration
async def test_get_mock_exam_history_unauthenticated(client: AsyncClient):
    """未認証で模擬試験履歴取得 → 401"""
    resp = await client.get("/api/v1/mock-exam/history")
    assert resp.status_code == 401
