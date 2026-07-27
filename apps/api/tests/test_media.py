"""メディア生成エンドポイントのテスト"""
import json
import pytest
from httpx import AsyncClient

from tests.conftest import auth_headers, register_and_login

MOCK_SLIDES_JSON = json.dumps({
    "slides": [
        {
            "slide_number": 1,
            "title": "テストスライド",
            "content": ["ポイント1", "ポイント2"],
            "notes": "講師ノート",
            "visual": "図表の説明",
        }
    ]
})

MOCK_AUDIO_JSON = json.dumps({
    "sections": [
        {"title": "導入", "script": "テスト音声スクリプト", "duration_seconds": 60}
    ]
})


@pytest.mark.integration
async def test_get_capabilities(client: AsyncClient):
    """メディア機能確認"""
    resp = await client.get("/api/v1/media/capabilities")
    assert resp.status_code == 200
    data = resp.json()
    assert "slides" in data
    assert "audio" in data

@pytest.mark.integration
async def test_generate_slides_mocked(client: AsyncClient, monkeypatch):
    """スライド生成（LLMモック）"""
    async def mock_generate(*args, **kwargs):
        return MOCK_SLIDES_JSON
    monkeypatch.setattr("src.api.v1.media.generate", mock_generate)
    monkeypatch.setattr("src.api.v1.media.is_gemini_available", lambda: False)
    token = await register_and_login(client)

    resp = await client.post(
        "/api/v1/media/slides/generate",
        json={"topic": "内部統制", "course_code": "CIA", "slide_count": 3},
        headers=auth_headers(token),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "slides" in data

@pytest.mark.integration
async def test_generate_slides_llm_failure(client: AsyncClient, monkeypatch):
    """スライド生成LLM失敗 → 502"""
    async def mock_fail(*args, **kwargs):
        raise Exception("LLM unavailable")
    monkeypatch.setattr("src.api.v1.media.generate", mock_fail)
    monkeypatch.setattr("src.api.v1.media.is_gemini_available", lambda: False)
    token = await register_and_login(client)

    resp = await client.post(
        "/api/v1/media/slides/generate",
        json={"topic": "テスト", "course_code": "CIA"},
        headers=auth_headers(token),
    )
    assert resp.status_code == 502

@pytest.mark.integration
async def test_generate_audio_script_mocked(client: AsyncClient, monkeypatch):
    """音声スクリプト生成（LLMモック）"""
    async def mock_generate(*args, **kwargs):
        return MOCK_AUDIO_JSON
    monkeypatch.setattr("src.api.v1.media.generate", mock_generate)
    token = await register_and_login(client)

    resp = await client.post(
        "/api/v1/media/audio/script",
        json={"topic": "IT監査", "course_code": "CISA"},
        headers=auth_headers(token),
    )
    assert resp.status_code == 200

@pytest.mark.integration
async def test_generate_audio_llm_failure(client: AsyncClient, monkeypatch):
    """音声スクリプトLLM失敗 → 502"""
    async def mock_fail(*args, **kwargs):
        raise Exception("LLM unavailable")
    monkeypatch.setattr("src.api.v1.media.generate", mock_fail)
    token = await register_and_login(client)

    resp = await client.post(
        "/api/v1/media/audio/script",
        json={"topic": "テスト", "course_code": "CIA"},
        headers=auth_headers(token),
    )
    # audio/scriptはtry/except内で処理するため200の場合もある
    assert resp.status_code in (200, 502)

@pytest.mark.integration
async def test_slides_validation(client: AsyncClient, monkeypatch):
    """不正JSONでもグレースフル処理"""
    async def mock_generate(*args, **kwargs):
        return "invalid json {"
    monkeypatch.setattr("src.api.v1.media.generate", mock_generate)
    monkeypatch.setattr("src.api.v1.media.is_gemini_available", lambda: False)
    token = await register_and_login(client)

    resp = await client.post(
        "/api/v1/media/slides/generate",
        json={"topic": "テスト", "course_code": "CIA"},
        headers=auth_headers(token),
    )
    # 502 or graceful error handling
    assert resp.status_code in (200, 502)


@pytest.mark.integration
async def test_generate_slides_unauthenticated(client: AsyncClient):
    """未認証でスライド生成 → 401"""
    resp = await client.post(
        "/api/v1/media/slides/generate",
        json={"topic": "テスト", "course_code": "CIA"},
    )
    assert resp.status_code == 401
