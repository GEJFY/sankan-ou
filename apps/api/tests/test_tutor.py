"""AI Tutorエンドポイントのテスト"""
import pytest
from httpx import AsyncClient

from tests.conftest import auth_headers, register_and_login


@pytest.mark.integration
async def test_explain_endpoint(client: AsyncClient, monkeypatch):
    """概念解説（SSE）"""
    async def mock_stream(*args, **kwargs):
        yield "テスト"
        yield "レスポンス"
    monkeypatch.setattr("src.api.v1.tutor.stream_generate", mock_stream)
    token = await register_and_login(client)

    resp = await client.post(
        "/api/v1/ai-tutor/explain",
        json={"concept": "内部統制", "level": 4},
        headers=auth_headers(token),
    )
    assert resp.status_code == 200
    assert "text/event-stream" in resp.headers.get("content-type", "")

@pytest.mark.integration
async def test_compare_endpoint(client: AsyncClient, monkeypatch):
    """比較解説"""
    async def mock_stream(*args, **kwargs):
        yield "CIA vs CISA"
    monkeypatch.setattr("src.api.v1.tutor.stream_generate", mock_stream)
    token = await register_and_login(client)

    resp = await client.post(
        "/api/v1/ai-tutor/compare",
        json={"concept": "リスク管理"},
        headers=auth_headers(token),
    )
    assert resp.status_code == 200

@pytest.mark.integration
async def test_chat_endpoint(client: AsyncClient, monkeypatch):
    """チャット"""
    async def mock_stream(*args, **kwargs):
        yield "チャット回答"
    monkeypatch.setattr("src.api.v1.tutor.stream_generate", mock_stream)
    token = await register_and_login(client)

    resp = await client.post(
        "/api/v1/ai-tutor/chat",
        json={"message": "COSOフレームワークとは？", "level": 3},
        headers=auth_headers(token),
    )
    assert resp.status_code == 200

@pytest.mark.integration
async def test_socratic_endpoint(client: AsyncClient, monkeypatch):
    """ソクラテス式対話"""
    async def mock_stream(*args, **kwargs):
        yield "考えてみましょう"
    monkeypatch.setattr("src.api.v1.tutor.stream_generate", mock_stream)
    token = await register_and_login(client)

    resp = await client.post(
        "/api/v1/ai-tutor/socratic",
        json={"concept": "COSO", "user_answer": "5つの構成要素", "is_correct": True},
        headers=auth_headers(token),
    )
    assert resp.status_code == 200

@pytest.mark.integration
async def test_bridge_endpoint(client: AsyncClient, monkeypatch):
    """知識ブリッジ"""
    async def mock_stream(*args, **kwargs):
        yield "ブリッジ説明"
    monkeypatch.setattr("src.api.v1.tutor.stream_generate", mock_stream)
    token = await register_and_login(client)

    resp = await client.post(
        "/api/v1/ai-tutor/bridge",
        json={"concept": "内部統制", "from_course": "CIA", "to_course": "CISA"},
        headers=auth_headers(token),
    )
    assert resp.status_code == 200

@pytest.mark.integration
async def test_explain_invalid_level(client: AsyncClient):
    """無効レベル → 422"""
    token = await register_and_login(client)
    resp = await client.post(
        "/api/v1/ai-tutor/explain",
        json={"concept": "テスト", "level": 99},
        headers=auth_headers(token),
    )
    assert resp.status_code == 422


@pytest.mark.integration
async def test_explain_unauthenticated(client: AsyncClient):
    """未認証で解説エンドポイント呼び出し → 401"""
    resp = await client.post(
        "/api/v1/ai-tutor/explain",
        json={"concept": "テスト", "level": 4},
    )
    assert resp.status_code == 401
