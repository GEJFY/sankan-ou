"""問題生成・回答エンドポイントのテスト"""
import json
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

MOCK_QUESTIONS_JSON = json.dumps([{
    "stem": "テスト問題: 内部統制の基本要素は？",
    "choices": [
        {"text": "統制環境", "is_correct": True, "explanation": "正解"},
        {"text": "外部監査", "is_correct": False, "explanation": "不正解"},
        {"text": "税務申告", "is_correct": False, "explanation": "不正解"},
        {"text": "予算編成", "is_correct": False, "explanation": "不正解"},
    ],
    "explanation": "内部統制の5つの構成要素の1つ",
    "difficulty": 2,
}])


@pytest.mark.integration
async def test_get_question_bank(client: AsyncClient, seed_questions):
    """問題バンク取得"""
    token = await _register_and_login(client)
    q_data = seed_questions["CIA"]
    resp = await client.get(
        f"/api/v1/questions/bank?topic_id={q_data['topic_id']}&count=5",
        headers=_auth_headers(token),
    )
    assert resp.status_code == 200
    assert "questions" in resp.json()

@pytest.mark.integration
async def test_generate_questions_mocked(client: AsyncClient, seed_all_courses, monkeypatch):
    """問題生成（LLMモック）"""
    token = await _register_and_login(client)
    course_ids = seed_all_courses

    async def mock_generate(*args, **kwargs):
        return MOCK_QUESTIONS_JSON
    monkeypatch.setattr("src.api.v1.questions.generate", mock_generate)

    # topic_id取得
    topics_resp = await client.get(f"/api/v1/courses/{course_ids['CIA']}/topics")
    topics = topics_resp.json()["topics"]
    assert len(topics) > 0
    topic_id = topics[0]["id"]

    resp = await client.post(
        "/api/v1/questions/generate",
        headers=_auth_headers(token),
        json={"topic_id": topic_id, "count": 1, "difficulty": 2},
    )
    assert resp.status_code == 200
    assert len(resp.json()["questions"]) >= 1

@pytest.mark.integration
async def test_generate_questions_llm_failure(client: AsyncClient, seed_all_courses, monkeypatch):
    """LLM失敗 → 502"""
    token = await _register_and_login(client)
    course_ids = seed_all_courses

    async def mock_fail(*args, **kwargs):
        raise Exception("LLM unavailable")
    monkeypatch.setattr("src.api.v1.questions.generate", mock_fail)

    topics_resp = await client.get(f"/api/v1/courses/{course_ids['CIA']}/topics")
    topics = topics_resp.json()["topics"]
    topic_id = topics[0]["id"]

    resp = await client.post(
        "/api/v1/questions/generate",
        headers=_auth_headers(token),
        json={"topic_id": topic_id, "count": 1, "difficulty": 2},
    )
    assert resp.status_code == 502

@pytest.mark.integration
async def test_answer_question(client: AsyncClient, seed_questions):
    """問題回答"""
    token = await _register_and_login(client)
    q_data = seed_questions["CIA"]
    resp = await client.post(
        "/api/v1/questions/answer",
        headers=_auth_headers(token),
        json={"question_id": str(q_data["question_id"]), "selected_index": 0, "response_time_ms": 5000},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "is_correct" in data
    assert "correct_index" in data
    assert "explanation" in data

@pytest.mark.integration
async def test_answer_nonexistent_question(client: AsyncClient, seed_all_courses):
    """存在しない問題 → 404"""
    import uuid
    token = await _register_and_login(client)
    resp = await client.post(
        "/api/v1/questions/answer",
        headers=_auth_headers(token),
        json={"question_id": str(uuid.uuid4()), "selected_index": 0},
    )
    assert resp.status_code == 404

@pytest.mark.integration
async def test_questions_unauthenticated_generate(client: AsyncClient):
    """未認証で問題生成 → 401"""
    import uuid
    resp = await client.post(
        "/api/v1/questions/generate",
        json={"topic_id": str(uuid.uuid4()), "count": 1, "difficulty": 2},
    )
    assert resp.status_code == 401

@pytest.mark.integration
async def test_questions_unauthenticated_bank(client: AsyncClient):
    """未認証で問題バンク → 401"""
    import uuid
    resp = await client.get(f"/api/v1/questions/bank?topic_id={uuid.uuid4()}")
    assert resp.status_code == 401
