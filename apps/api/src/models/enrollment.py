"""UserEnrollment model"""

import uuid

from sqlalchemy import ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class UserEnrollment(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """ユーザー × コース登録"""

    __tablename__ = "user_enrollments"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    course_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False, index=True
    )
    # FSRS desired retention (default 0.9 = 90%)
    desired_retention: Mapped[float] = mapped_column(Numeric(4, 3), default=0.9)
    is_active: Mapped[bool] = mapped_column(default=True)

    # Relationships
    user = relationship("User", back_populates="enrollments")
    course = relationship("Course")
