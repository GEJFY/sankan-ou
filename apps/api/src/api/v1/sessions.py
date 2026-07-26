"""Study Session endpoints

合格確率予測(/predictions/*)は src/api/v1/predictions.py が単一の実装元。
以前はこのファイルにも同名の重複ルートが定義されており、ルーター登録順の関係で
そちらが常勝ち(predictions.pyの実装が到達不能なデッドコードになる)し、
かつ UserTopicMastery を更新する呼び出し元がどこにも存在しなかったため、
合格確率が実際の学習データと無関係に常にほぼ0%を返す不具合があった。
"""

import uuid

from fastapi import APIRouter
from pydantic import BaseModel, Field

from src.deps import CurrentUser, DbSession
from src.services.session_service import (
    mastery_service,
    session_service,
)

router = APIRouter(tags=["sessions"])


# --- Schemas ---
class StartSessionRequest(BaseModel):
    course_id: uuid.UUID
    session_type: str = Field(default="review", pattern="^(review|quiz|tutor|synergy)$")


class EndSessionRequest(BaseModel):
    session_id: uuid.UUID
    cards_reviewed: int = Field(ge=0)
    cards_correct: int = Field(ge=0)


# --- Sessions ---
@router.post("/sessions/start")
async def start_session(body: StartSessionRequest, db: DbSession, current_user: CurrentUser):
    """学習セッション開始"""
    session = await session_service.start_session(
        db, current_user.id, body.course_id, body.session_type
    )
    return {
        "session_id": str(session.id),
        "started_at": session.started_at,
        "session_type": session.session_type,
    }


@router.post("/sessions/end")
async def end_session(body: EndSessionRequest, db: DbSession, current_user: CurrentUser):
    """学習セッション終了"""
    session = await session_service.end_session(
        db, body.session_id, body.cards_reviewed, body.cards_correct
    )
    if session is None:
        return {"error": "Session not found"}
    return {
        "session_id": str(session.id),
        "duration_seconds": session.duration_seconds,
        "cards_reviewed": session.cards_reviewed,
        "cards_correct": session.cards_correct,
        "accuracy": (
            round(session.cards_correct / session.cards_reviewed * 100, 1)
            if session.cards_reviewed > 0
            else 0
        ),
    }


@router.get("/sessions/recent")
async def get_recent_sessions(db: DbSession, current_user: CurrentUser, limit: int = 10):
    """直近セッション一覧"""
    sessions = await session_service.get_recent_sessions(db, current_user.id, limit)
    return {
        "sessions": [
            {
                "id": str(s.id),
                "course_id": str(s.course_id),
                "session_type": s.session_type,
                "cards_reviewed": s.cards_reviewed,
                "cards_correct": s.cards_correct,
                "duration_seconds": s.duration_seconds,
                "started_at": s.started_at,
                "ended_at": s.ended_at,
            }
            for s in sessions
        ]
    }


@router.get("/sessions/today")
async def get_today_stats(db: DbSession, current_user: CurrentUser):
    """今日の学習統計"""
    stats = await session_service.get_today_stats(db, current_user.id)
    streak = await session_service.get_streak_days(db, current_user.id)
    return {**stats, "streak_days": streak}


# --- Mastery ---
@router.get("/mastery/{course_id}")
async def get_course_mastery(course_id: uuid.UUID, db: DbSession, current_user: CurrentUser):
    """コース内トピック別習熟度"""
    mastery = await mastery_service.get_course_mastery(
        db, current_user.id, course_id
    )
    return {"topics": mastery, "total": len(mastery)}
