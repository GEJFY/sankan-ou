"""Gamification API - XP, badges, daily missions"""

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.services.gamification_service import GamificationService

router = APIRouter(prefix="/gamification", tags=["gamification"])

# デモ用ユーザーID (将来は認証から取得)
DEMO_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


@router.get("/profile")
async def get_profile(db: AsyncSession = Depends(get_db)):
    """ユーザーのゲーミフィケーションプロフィール"""
    svc = GamificationService(db)
    profile = await svc.get_user_profile(DEMO_USER_ID)
    return profile


@router.get("/missions")
async def get_daily_missions(db: AsyncSession = Depends(get_db)):
    """今日のデイリーミッション"""
    svc = GamificationService(db)
    missions = await svc.get_daily_missions(DEMO_USER_ID)
    return {"missions": missions, "completed": sum(1 for m in missions if m["is_completed"])}


@router.get("/xp/history")
async def get_xp_history(
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """XP獲得履歴"""
    svc = GamificationService(db)
    history = await svc.get_xp_history(DEMO_USER_ID, limit)
    return {"history": history}


@router.get("/badges")
async def get_badges(db: AsyncSession = Depends(get_db)):
    """ユーザーの獲得バッジ一覧"""
    svc = GamificationService(db)
    profile = await svc.get_user_profile(DEMO_USER_ID)
    return {
        "badges": profile["badges"],
        "badge_count": profile["badge_count"],
    }


@router.get("/leaderboard")
async def get_leaderboard(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """XPリーダーボード"""
    svc = GamificationService(db)
    leaderboard = await svc.get_leaderboard(limit)
    return {"leaderboard": leaderboard}


@router.post("/xp/award")
async def award_xp_manual(
    amount: int = Query(..., ge=1, le=1000),
    source: str = Query("manual"),
    db: AsyncSession = Depends(get_db),
):
    """XP手動付与 (テスト/管理用)"""
    svc = GamificationService(db)
    result = await svc.award_xp(DEMO_USER_ID, amount, source)
    return result
