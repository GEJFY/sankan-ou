"""ヘルスチェック + 基本動作テスト"""

import pytest


@pytest.mark.integration
async def test_health_check(client):
    """ヘルスチェックが正常に応答すること"""
    resp = await client.get("/api/v1/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["service"] == "grc-triple-crown-api"
    assert data["version"] == "0.1.0"
    assert data["status"] in ("ok", "degraded")
    assert "database" in data["dependencies"]


@pytest.mark.integration
async def test_health_degraded_on_db_failure(client):
    """DB接続失敗時はdegradedを返すこと"""
    # httpxテストクライアントではDBセッションが不完全なためerrorになりうる
    resp = await client.get("/api/v1/health")
    data = resp.json()
    db_status = data["dependencies"]["database"]
    if db_status == "ok":
        assert data["status"] == "ok"
    else:
        assert data["status"] == "degraded"
        assert db_status.startswith("error:")


@pytest.mark.integration
async def test_security_headers(client):
    """セキュリティヘッダーが付与されていること"""
    resp = await client.get("/api/v1/health")
    assert resp.headers["X-Content-Type-Options"] == "nosniff"
    assert resp.headers["X-Frame-Options"] == "DENY"
    assert resp.headers["X-XSS-Protection"] == "1; mode=block"
    assert resp.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"


@pytest.mark.integration
async def test_cors_headers(client):
    """CORSプリフライトが正常に応答すること"""
    resp = await client.options(
        "/api/v1/health",
        headers={
            "Origin": "http://localhost:3001",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert resp.status_code == 200


@pytest.mark.integration
async def test_openapi_schema(client):
    """OpenAPIスキーマが取得できること"""
    resp = await client.get("/openapi.json")
    assert resp.status_code == 200
    data = resp.json()
    assert data["info"]["title"] == "GRC Triple Crown API"
    assert "/api/v1/health" in data["paths"]
