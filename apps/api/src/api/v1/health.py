"""Health check endpoint"""

from fastapi import APIRouter
from sqlalchemy import text

from src.deps import DbSession

router = APIRouter()


@router.get("/health")
async def health_check(db: DbSession) -> dict:
    """ヘルスチェック - DB接続も検証"""
    db_status = "ok"
    try:
        await db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"error: {type(e).__name__}"

    status = "ok" if db_status == "ok" else "degraded"
    return {
        "status": status,
        "service": "grc-triple-crown-api",
        "version": "0.1.0",
        "dependencies": {"database": db_status},
    }
