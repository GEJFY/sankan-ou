"""Gamification API - XP, badges, daily missions"""

from fastapi import APIRouter, Query

from src.deps import CurrentUser, DbSession
from src.services.gamification_service import GamificationService

router = APIRouter(prefix="/gamification", tags=["gamification"])


@router.get("/profile")
async def get_profile(db: DbSession, current_user: CurrentUser):
    """ユーザーのゲーミフィケーションプロフィール"""
    svc = GamificationService(db)
    profile = await svc.get_user_profile(current_user.id)
    return profile


@router.get("/missions")
async def get_daily_missions(db: DbSession, current_user: CurrentUser):
    """今日のデイリーミッション"""
    svc = GamificationService(db)
    missions = await svc.get_daily_missions(current_user.id)
    return {"missions": missions, "completed": sum(1 for m in missions if m["is_completed"])}


@router.get("/xp/history")
async def get_xp_history(
    db: DbSession,
    current_user: CurrentUser,
    limit: int = Query(20, ge=1, le=100),
):
    """XP獲得履歴"""
    svc = GamificationService(db)
    history = await svc.get_xp_history(current_user.id, limit)
    return {"history": history}


@router.get("/badges")
async def get_badges(db: DbSession, current_user: CurrentUser):
    """ユーザーの獲得バッジ一覧"""
    svc = GamificationService(db)
    profile = await svc.get_user_profile(current_user.id)
    return {
        "badges": profile["badges"],
        "badge_count": profile["badge_count"],
    }


@router.get("/leaderboard")
async def get_leaderboard(
    db: DbSession,
    limit: int = Query(10, ge=1, le=50),
):
    """XPリーダーボード"""
    svc = GamificationService(db)
    leaderboard = await svc.get_leaderboard(limit)
    return {"leaderboard": leaderboard}


@router.post("/xp/award")
async def award_xp_manual(
    db: DbSession,
    current_user: CurrentUser,
    amount: int = Query(..., ge=1, le=1000),
    source: str = Query("manual"),
):
    """XP手動付与 (テスト/管理用)"""
    svc = GamificationService(db)
    result = await svc.award_xp(current_user.id, amount, source)
    return result
