"""Question and QuestionAttempt models"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, SmallInteger, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Question(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """LLM生成問題"""

    __tablename__ = "questions"

    course_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False, index=True
    )
    topic_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("topics.id"), nullable=False, index=True
    )
    stem: Mapped[str] = mapped_column(Text, nullable=False)  # 問題文
    # [{text: "...", is_correct: true/false, explanation: "..."}]
    choices: Mapped[list] = mapped_column(JSONB, nullable=False)
    explanation: Mapped[str] = mapped_column(Text, default="")  # 全体解説
    difficulty: Mapped[int] = mapped_column(SmallInteger, default=2)  # 1-5
    format: Mapped[str] = mapped_column(String(20), default="multiple_choice")  # multiple_choice / scenario
    source: Mapped[str] = mapped_column(String(20), default="llm")  # llm / manual


class QuestionAttempt(UUIDPrimaryKeyMixin, Base):
    """回答履歴"""

    __tablename__ = "question_attempts"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    question_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("questions.id"), nullable=False, index=True
    )
    selected_index: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    is_correct: Mapped[bool] = mapped_column(nullable=False)
    response_time_ms: Mapped[int] = mapped_column(Integer, default=0)
    attempted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
