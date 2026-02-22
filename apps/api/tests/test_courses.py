"""コースエンドポイントのテスト"""
import pytest
from httpx import AsyncClient


@pytest.mark.integration
async def test_list_courses(client: AsyncClient, seed_courses):
    """コース一覧取得"""
    resp = await client.get("/api/v1/courses")
    assert resp.status_code == 200
    data = resp.json()
    assert "courses" in data
    assert len(data["courses"]) >= 1


@pytest.mark.integration
async def test_list_courses_include_all(client: AsyncClient, seed_courses):
    """全コース一覧取得"""
    resp = await client.get("/api/v1/courses?include_all=true")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["courses"]) >= 2


@pytest.mark.integration
async def test_get_course_by_id(client: AsyncClient, seed_courses):
    """コース詳細取得"""
    courses_resp = await client.get("/api/v1/courses?include_all=true")
    course_id = courses_resp.json()["courses"][0]["id"]
    resp = await client.get(f"/api/v1/courses/{course_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert "code" in data
    assert "name" in data


@pytest.mark.integration
async def test_get_course_not_found(client: AsyncClient):
    """存在しないコース → エラー"""
    import uuid
    resp = await client.get(f"/api/v1/courses/{uuid.uuid4()}")
    assert resp.status_code in (404, 500)


@pytest.mark.integration
async def test_list_topics(client: AsyncClient, seed_all_courses):
    """トピック一覧取得"""
    course_ids = seed_all_courses
    cia_id = course_ids["CIA"]
    resp = await client.get(f"/api/v1/courses/{cia_id}/topics")
    assert resp.status_code == 200
    data = resp.json()
    assert "topics" in data
    assert len(data["topics"]) >= 1


@pytest.mark.integration
async def test_list_topics_has_name(client: AsyncClient, seed_all_courses):
    """トピックにname/idフィールドあり"""
    course_ids = seed_all_courses
    resp = await client.get(f"/api/v1/courses/{course_ids['CIA']}/topics")
    topics = resp.json()["topics"]
    if topics:
        assert "name" in topics[0]
        assert "id" in topics[0]
