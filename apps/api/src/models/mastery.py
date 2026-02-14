"""UserTopicMastery and StudySession models"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, SmallInteger, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class UserTopicMastery(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """トピック別習熟度 (集計キャッシュ)"""

    __tablename__ = "user_topic_mastery"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    topic_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("topics.id"), nullable=False, index=True
    )
    mastery_score: Mapped[float] = mapped_column(Numeric(5, 4), default=0)  # 0.0 ~ 1.0
    total_reviews: Mapped[int] = mapped_column(Integer, default=0)
    correct_reviews: Mapped[int] = mapped_column(Integer, default=0)
    avg_response_ms: Mapped[int] = mapped_column(Integer, default=0)


class StudySession(UUIDPrimaryKeyMixin, Base):
    """学習セッション追跡"""

    __tablename__ = "study_sessions"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    course_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False, index=True
    )
    cards_reviewed: Mapped[int] = mapped_column(Integer, default=0)
    cards_correct: Mapped[int] = mapped_column(Integer, default=0)
    duration_seconds: Mapped[int] = mapped_column(Integer, default=0)
    session_type: Mapped[str] = mapped_column(default="review")  # review / quiz / tutor
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)

    # Relationships
    user = relationship("User", back_populates="study_sessions")


class ScorePrediction(UUIDPrimaryKeyMixin, Base):
    """合格確率予測"""

    __tablename__ = "score_predictions"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    course_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False, index=True
    )
    predicted_score: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    pass_probability: Mapped[float] = mapped_column(Numeric(5, 4), nullable=False)
    # 弱点トピックIDリスト
    weak_topic_count: Mapped[int] = mapped_column(SmallInteger, default=0)
    predicted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
