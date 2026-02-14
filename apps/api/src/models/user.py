"""User model"""

from sqlalchemy import String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="learner")  # learner / admin
    # FSRS per-user parameters (optimized over time)
    fsrs_parameters: Mapped[dict | None] = mapped_column(JSONB, default=None)
    is_active: Mapped[bool] = mapped_column(default=True)

    # Relationships
    enrollments = relationship("UserEnrollment", back_populates="user", lazy="selectin")
    card_reviews = relationship("CardReview", back_populates="user", lazy="noload")
    study_sessions = relationship("StudySession", back_populates="user", lazy="noload")
