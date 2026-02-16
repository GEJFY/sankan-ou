"""Dashboard endpoints"""

from datetime import datetime, timezone

from fastapi import APIRouter
from sqlalchemy import func, select

from src.deps import CurrentUser, DbSession
from src.models.card import Card, CardReview, ReviewLog
from src.models.course import Course, Topic
from src.schemas.dashboard import (
    CourseSummary,
    DailyHistory,
    DashboardSummaryResponse,
    HistoryResponse,
    WeakTopic,
    WeakTopicsResponse,
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummaryResponse)
async def get_summary(db: DbSession, current_user: CurrentUser) -> DashboardSummaryResponse:
    """3資格別進捗サマリー"""
    now = datetime.now(timezone.utc)
    courses_result = await db.execute(
        select(Course).where(Course.is_active == True).order_by(Course.sort_order)  # noqa: E712
    )
    courses = courses_result.scalars().all()

    summaries = []
    for course in courses:
        # Total cards
        total = (
            await db.execute(
                select(func.count(Card.id)).where(Card.course_id == course.id)
            )
        ).scalar() or 0

        # Due today
        due = (
            await db.execute(
                select(func.count(CardReview.id))
                .join(Card, CardReview.card_id == Card.id)
                .where(Card.course_id == course.id)
                .where(CardReview.user_id == current_user.id)
                .where(CardReview.due <= now)
            )
        ).scalar() or 0

        # Mastered (state=2=Review, stability > 21 days)
        mastered = (
            await db.execute(
                select(func.count(CardReview.id))
                .join(Card, CardReview.card_id == Card.id)
                .where(Card.course_id == course.id)
                .where(CardReview.user_id == current_user.id)
                .where(CardReview.state == 2)
                .where(CardReview.stability > 21)
            )
        ).scalar() or 0

        pass_prob = (mastered / total) if total > 0 else 0.0

        summaries.append(
            CourseSummary(
                course_id=course.id,
                course_code=course.code,
                course_name=course.name,
                color=course.color,
                total_cards=total,
                mastered=mastered,
                due_today=due,
                pass_probability=round(pass_prob, 4),
            )
        )

    # 今日の学習数
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    studied_today = (
        await db.execute(
            select(func.count(ReviewLog.id))
            .join(CardReview, ReviewLog.card_review_id == CardReview.id)
            .where(CardReview.user_id == current_user.id)
            .where(ReviewLog.reviewed_at >= today_start)
        )
    ).scalar() or 0

    return DashboardSummaryResponse(
        courses=summaries,
        total_studied_today=studied_today,
        streak_days=0,
    )


@router.get("/weak-topics", response_model=WeakTopicsResponse)
async def get_weak_topics(db: DbSession, current_user: CurrentUser) -> WeakTopicsResponse:
    """弱点トピックTOP5"""
    stmt = (
        select(
            Topic.id,
            Topic.name,
            Course.code,
            Course.color,
            func.count(CardReview.id).label("total"),
            func.coalesce(func.sum(CardReview.lapses), 0).label("total_lapses"),
        )
        .join(Card, CardReview.card_id == Card.id)
        .join(Topic, Card.topic_id == Topic.id)
        .join(Course, Card.course_id == Course.id)
        .where(CardReview.user_id == current_user.id)
        .group_by(Topic.id, Topic.name, Course.code, Course.color)
    )

    result = await db.execute(stmt)
    rows = result.all()

    weak_topics = []
    for row in rows:
        total = row.total or 1
        lapses = row.total_lapses or 0
        mastery = max(0.0, 1.0 - (lapses / (total * 3)))
        weak_topics.append(
            WeakTopic(
                topic_id=row.id,
                topic_name=row.name,
                course_code=row.code,
                color=row.color,
                mastery_score=round(mastery, 4),
                total_cards=total,
                failed_cards=min(int(lapses), total),
            )
        )

    weak_topics.sort(key=lambda x: x.mastery_score)
    return WeakTopicsResponse(topics=weak_topics[:5])


@router.get("/history", response_model=HistoryResponse)
async def get_history(db: DbSession, current_user: CurrentUser) -> HistoryResponse:
    """直近14日の学習履歴"""
    stmt = (
        select(
            func.date(ReviewLog.reviewed_at).label("review_date"),
            func.count(ReviewLog.id).label("cards_reviewed"),
        )
        .join(CardReview, ReviewLog.card_review_id == CardReview.id)
        .where(CardReview.user_id == current_user.id)
        .group_by(func.date(ReviewLog.reviewed_at))
        .order_by(func.date(ReviewLog.reviewed_at).desc())
        .limit(14)
    )
    result = await db.execute(stmt)
    rows = result.all()

    history = [
        DailyHistory(
            date=str(row.review_date),
            cards_reviewed=row.cards_reviewed,
            correct=0,
            minutes=row.cards_reviewed,
        )
        for row in rows
    ]

    return HistoryResponse(history=list(reversed(history)))
