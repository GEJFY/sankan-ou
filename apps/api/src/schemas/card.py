"""Card and Review schemas"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class CardOut(BaseModel):
    """カード情報レスポンス"""

    id: uuid.UUID
    course_id: uuid.UUID
    topic_id: uuid.UUID
    front: str
    back: str
    is_synergy: bool
    difficulty_tier: int
    tags: list[str] | None = None

    model_config = {"from_attributes": True}


class CardWithReviewOut(CardOut):
    """FSRS状態付きカード"""

    state: int
    due: datetime
    difficulty: float
    stability: float
    retrievability: float

    model_config = {"from_attributes": True}


class ReviewRequest(BaseModel):
    """レビュー送信"""

    card_id: uuid.UUID
    rating: int = Field(ge=1, le=4, description="1=Again, 2=Hard, 3=Good, 4=Easy")
    response_time_ms: int = Field(default=0, ge=0)


class ReviewResponse(BaseModel):
    """レビュー結果"""

    card_id: uuid.UUID
    state: int
    due: datetime
    difficulty: float
    stability: float
    retrievability: float
    next_review_in_hours: float

    model_config = {"from_attributes": True}


class DueCardsResponse(BaseModel):
    """復習カードリスト"""

    cards: list[CardWithReviewOut]
    total_due: int
