"""シナジーエンドポイントのテスト"""
import pytest
from httpx import AsyncClient


@pytest.mark.integration
async def test_synergy_areas(client: AsyncClient):
    """シナジー領域一覧"""
    resp = await client.get("/api/v1/synergy/areas")
    assert resp.status_code == 200
    data = resp.json()
    assert "synergy_areas" in data
    assert "total" in data


@pytest.mark.integration
async def test_synergy_overview(client: AsyncClient):
    """シナジー概要"""
    resp = await client.get("/api/v1/synergy/overview")
    assert resp.status_code == 200
    data = resp.json()
    assert "courses" in data
    assert "synergy_areas" in data


@pytest.mark.integration
async def test_synergy_course_cia(client: AsyncClient):
    """CIAプラグイン情報"""
    resp = await client.get("/api/v1/synergy/course/CIA")
    assert resp.status_code == 200
    data = resp.json()
    assert data["course_code"] == "CIA"
    assert "syllabus" in data
    assert "exam_config" in data


@pytest.mark.integration
async def test_synergy_course_unknown(client: AsyncClient):
    """不明コース"""
    resp = await client.get("/api/v1/synergy/course/UNKNOWN")
    assert resp.status_code == 200
    assert "error" in resp.json()


@pytest.mark.integration
async def test_synergy_study_cards(client: AsyncClient, seed_all_courses):
    """シナジーカード取得"""
    resp = await client.get("/api/v1/synergy/study")
    assert resp.status_code == 200
    data = resp.json()
    assert "cards" in data
    assert "total" in data


@pytest.mark.integration
async def test_synergy_study_filtered(client: AsyncClient, seed_all_courses):
    """コースフィルタ付きシナジーカード"""
    resp = await client.get("/api/v1/synergy/study?course_code=CIA")
    assert resp.status_code == 200
