"""MockExamResult model - 模擬試験結果の永続化"""

import uuid

from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, SmallInteger, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class MockExamResult(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """模擬試験結果"""

    __tablename__ = "mock_exam_results"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    course_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False, index=True
    )
    course_code: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    score_pct: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    correct_count: Mapped[int] = mapped_column(Integer, nullable=False)
    total_questions: Mapped[int] = mapped_column(Integer, nullable=False)
    passed: Mapped[bool] = mapped_column(Boolean, nullable=False)
    passing_score_pct: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    time_taken_seconds: Mapped[int] = mapped_column(Integer, default=0)
    question_ids: Mapped[list] = mapped_column(JSONB, default=list)
    answer_indices: Mapped[list] = mapped_column(JSONB, default=list)
