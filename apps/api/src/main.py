"""FastAPI application factory"""

from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from src.config import settings


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
        description="AI駆動型 CIA/CISA/CFE 学習プラットフォーム",
        version="0.1.0",
        lifespan=lifespan,
        debug=settings.debug,
    )

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
