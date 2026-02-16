"""FastAPI application factory"""

from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
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


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    logger.info("GRC Triple Crown API starting...")

    # ゲーミフィケーション用テーブル作成 + バッジシード
    try:
        from src.database import engine, async_session_factory
        from src.models.base import Base
        from src.models.gamification import Badge, DailyMission, UserBadge, UserXP, XPLog

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        from src.services.gamification_service import seed_badges

        async with async_session_factory() as session:
            await seed_badges(session)
        logger.info("Gamification tables and badges initialized")
    except Exception as e:
        logger.warning(f"Gamification init skipped: {e}")

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

    return application


app = create_app()
