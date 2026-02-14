"""Card, CardReview, ReviewLog models"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, SmallInteger, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Card(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """学習カード (表/裏 + メタデータ)"""

    __tablename__ = "cards"

    course_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False, index=True
    )
    topic_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("topics.id"), nullable=False, index=True
    )
    front: Mapped[str] = mapped_column(Text, nullable=False)
    back: Mapped[str] = mapped_column(Text, nullable=False)
    is_synergy: Mapped[bool] = mapped_column(default=False)  # 複数資格に共通
    # 6段階レベル別解説 {1: "小学生向け...", 2: "中学生向け...", ...}
    level_explanations: Mapped[dict | None] = mapped_column(JSONB, default=None)
    tags: Mapped[list | None] = mapped_column(JSONB, default=None)  # ["内部統制", "COSO"]
    difficulty_tier: Mapped[int] = mapped_column(SmallInteger, default=1)  # 1=基礎, 2=応用, 3=発展

    # Relationships
    course = relationship("Course", back_populates="cards")
    topic = relationship("Topic", back_populates="cards")
    reviews = relationship("CardReview", back_populates="card", lazy="noload")


class CardReview(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """FSRS state per user per card"""

    __tablename__ = "card_reviews"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    card_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cards.id"), nullable=False, index=True
    )
    # FSRS DSR model
    difficulty: Mapped[float] = mapped_column(Numeric(8, 6), default=0)
    stability: Mapped[float] = mapped_column(Numeric(12, 6), default=0)
    retrievability: Mapped[float] = mapped_column(Numeric(8, 6), default=1.0)
    # FSRS state: 0=New, 1=Learning, 2=Review, 3=Relearning
    state: Mapped[int] = mapped_column(SmallInteger, default=0)
    due: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    last_review: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    reps: Mapped[int] = mapped_column(Integer, default=0)
    lapses: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    user = relationship("User", back_populates="card_reviews")
    card = relationship("Card", back_populates="reviews")
    review_logs = relationship("ReviewLog", back_populates="card_review", lazy="noload")

    __table_args__ = (
        # user_id + card_id でユニーク (1ユーザーにつきカード1レコード)
        {"comment": "FSRS state per user per card"},
    )


class ReviewLog(UUIDPrimaryKeyMixin, Base):
    """復習履歴ログ (不変)"""

    __tablename__ = "review_logs"

    card_review_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("card_reviews.id"), nullable=False, index=True
    )
    # Rating: 1=Again, 2=Hard, 3=Good, 4=Easy
    rating: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    # State before/after this review
    state_before: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    state_after: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    difficulty_before: Mapped[float] = mapped_column(Numeric(8, 6), default=0)
    difficulty_after: Mapped[float] = mapped_column(Numeric(8, 6), default=0)
    stability_before: Mapped[float] = mapped_column(Numeric(12, 6), default=0)
    stability_after: Mapped[float] = mapped_column(Numeric(12, 6), default=0)
    response_time_ms: Mapped[int] = mapped_column(Integer, default=0)
    reviewed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    # Relationships
    card_review = relationship("CardReview", back_populates="review_logs")
