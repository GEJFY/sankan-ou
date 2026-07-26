"""FastAPI application factory"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger
from starlette.middleware.base import BaseHTTPMiddleware

from src.config import settings


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """本番環境向けセキュリティヘッダー"""

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        if not settings.debug:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


_INSECURE_DEFAULT_JWT_SECRET = "change-me-in-production"


def _assert_safe_config() -> None:
    """本番相当環境でデフォルトの危険な設定のまま起動しないようにする"""
    if not settings.debug and settings.jwt_secret == _INSECURE_DEFAULT_JWT_SECRET:
        raise RuntimeError(
            "JWT_SECRET がデフォルト値のままです。環境変数 JWT_SECRET を必ず設定してください "
            "(settings.debug=False の環境ではデフォルト値での起動を拒否しています)。"
        )


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    logger.info("GRC Triple Crown API starting...")
    _assert_safe_config()

    # バッジシード（テーブルはAlembicマイグレーションで管理）
    try:
        from src.database import async_session_factory
        from src.services.gamification_service import seed_badges
        from src.services.synergy_service import sync_synergy_flags

        async with async_session_factory() as session:
            await seed_badges(session)
            updated = await sync_synergy_flags(session)
            await session.commit()
        logger.info(f"Badge seed completed, synergy flags synced ({updated} cards updated)")
    except Exception as e:
        logger.warning(f"Badge seed / synergy sync skipped: {e}")

    yield
    logger.info("GRC Triple Crown API shutting down...")


def create_app() -> FastAPI:
    application = FastAPI(
        title="GRC Triple Crown API",
        description="AI駆動型 CIA/CISA/CFE/USCPA 学習プラットフォーム",
        version="0.1.0",
        lifespan=lifespan,
        debug=settings.debug,
    )

    # セキュリティヘッダー
    application.add_middleware(SecurityHeadersMiddleware)

    # CORS
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routers
    from src.api.v1.router import api_router

    application.include_router(api_router, prefix="/api/v1")

    @application.exception_handler(Exception)
    async def _unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        """未処理の例外は内部情報を漏らさず一律500として返す

        StarletteはHTTPException/RequestValidationErrorに対するFastAPI標準ハンドラを
        MRO上でより具体的な一致として優先するため、ここには本当に予期しない例外のみ届く。
        """
        logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "予期しないエラーが発生しました。しばらくしてから再度お試しください。"},
        )

    return application


app = create_app()
