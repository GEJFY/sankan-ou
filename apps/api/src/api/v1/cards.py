"""Card and Review endpoints"""

import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Query
from sqlalchemy import func, select

from src.deps import CurrentUser, DbSession
from src.models.card import Card, CardReview, ReviewLog
from src.models.course import Course
from src.schemas.card import (
    CardWithReviewOut,
    DueCardsResponse,
    ReviewRequest,
    ReviewResponse,
)
from src.services.fsrs_service import fsrs_service
from src.services.gamification_service import GamificationService
from src.services.session_service import session_service

router = APIRouter(prefix="/cards", tags=["cards"])


@router.get("/due", response_model=DueCardsResponse)
async def get_due_cards(
    db: DbSession,
    current_user: CurrentUser,
    course_id: uuid.UUID | None = Query(None, description="コースでフィルタ"),
    limit: int = Query(25, ge=1, le=100),
) -> DueCardsResponse:
    """復習期日到来カード取得"""
    card_reviews = await fsrs_service.get_due_cards(
        db, user_id=current_user.id, course_id=course_id, limit=limit
    )

    # 新規ユーザー: due CardReview が0件なら、未学習カードからCardReviewを自動作成
    if len(card_reviews) == 0:
        existing_subq = select(CardReview.card_id).where(
            CardReview.user_id == current_user.id
        )
        stmt = select(Card).where(~Card.id.in_(existing_subq))
        if course_id:
            stmt = stmt.where(Card.course_id == course_id)
        stmt = stmt.order_by(Card.created_at).limit(limit)
        new_cards = (await db.execute(stmt)).scalars().all()

        for card in new_cards:
            cr = await fsrs_service.get_or_create_review(
                db, user_id=current_user.id, card_id=card.id
            )
            card_reviews.append(cr)

    cards_out = []
    for cr in card_reviews:
        # Eager load card data
        card = await db.get(Card, cr.card_id)
        if card:
            cards_out.append(
                CardWithReviewOut(
                    id=card.id,
                    course_id=card.course_id,
                    topic_id=card.topic_id,
                    front=card.front,
                    back=card.back,
                    is_synergy=card.is_synergy,
                    difficulty_tier=card.difficulty_tier,
                    tags=card.tags,
                    state=cr.state,
                    due=cr.due,
                    difficulty=float(cr.difficulty),
                    stability=float(cr.stability),
                    retrievability=float(cr.retrievability),
                )
            )

    return DueCardsResponse(cards=cards_out, total_due=len(cards_out))


@router.post("/review", response_model=ReviewResponse)
async def submit_review(
    body: ReviewRequest,
    db: DbSession,
    current_user: CurrentUser,
) -> ReviewResponse:
    """レビュー結果送信 → FSRS更新 + XP/ミッション/バッジ付与"""
    card = await db.get(Card, body.card_id)
    course_code: str | None = None
    if card:
        course = await db.get(Course, card.course_id)
        course_code = course.code if course else None

    # CardReview取得 or 新規作成
    card_review = await fsrs_service.get_or_create_review(
        db, user_id=current_user.id, card_id=body.card_id
    )

    # FSRSレビュー実行
    updated_review, review_log = fsrs_service.review_card(
        card_review, body.rating, body.response_time_ms
    )

    # ReviewLog保存
    db.add(review_log)
    await db.flush()

    # --- ゲーミフィケーション: XP付与 + デイリーミッション進捗 + バッジ判定 ---
    is_synergy = bool(card.is_synergy) if card else False
    gam = GamificationService(db)
    await gam.award_review_xp(
        current_user.id, body.rating, course_code=course_code, is_synergy=is_synergy
    )
    await gam.update_mission_progress(current_user.id, "review_cards", 1)
    if body.rating >= 3:
        await gam.update_mission_progress(current_user.id, "review_good", 1)
    if is_synergy:
        await gam.update_mission_progress(current_user.id, "synergy_study", 1)

    total_reviews = (
        await db.execute(
            select(func.count(ReviewLog.id))
            .join(CardReview, ReviewLog.card_review_id == CardReview.id)
            .where(CardReview.user_id == current_user.id)
        )
    ).scalar() or 0

    synergy_reviews = (
        await db.execute(
            select(func.count(ReviewLog.id))
            .join(CardReview, ReviewLog.card_review_id == CardReview.id)
            .join(Card, CardReview.card_id == Card.id)
            .where(CardReview.user_id == current_user.id, Card.is_synergy.is_(True))
        )
    ).scalar() or 0

    course_codes_studied = (
        (
            await db.execute(
                select(Course.code)
                .join(Card, Card.course_id == Course.id)
                .join(CardReview, CardReview.card_id == Card.id)
                .where(CardReview.user_id == current_user.id)
                .distinct()
            )
        )
        .scalars()
        .all()
    )

    streak_days = await session_service.get_streak_days(db, current_user.id)

    await gam.check_and_award_badges(
        current_user.id,
        total_reviews=total_reviews,
        streak_days=streak_days,
        synergy_reviews=synergy_reviews,
        courses_studied=list(course_codes_studied),
    )

    # 次回レビューまでの時間計算
    now = datetime.now(UTC)
    next_hours = max(0, (updated_review.due - now).total_seconds() / 3600)

    return ReviewResponse(
        card_id=body.card_id,
        state=updated_review.state,
        due=updated_review.due,
        difficulty=float(updated_review.difficulty),
        stability=float(updated_review.stability),
        retrievability=float(updated_review.retrievability),
        next_review_in_hours=round(next_hours, 1),
    )
