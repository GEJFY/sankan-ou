"""Card and Review endpoints"""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Query

from src.deps import CurrentUser, DbSession
from src.models.card import Card, CardReview
from src.schemas.card import (
    CardWithReviewOut,
    DueCardsResponse,
    ReviewRequest,
    ReviewResponse,
)
from src.services.fsrs_service import fsrs_service

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
    """レビュー結果送信 → FSRS更新"""
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

    # 次回レビューまでの時間計算
    now = datetime.now(timezone.utc)
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
