"""Course and Topic models"""

import uuid

from sqlalchemy import ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Course(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "courses"

    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)  # CIA, CISA, CFE
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    color: Mapped[str] = mapped_column(String(7), nullable=False)  # hex: #e94560
    # 試験設定 (パート数, 問題数, 合格ライン等)
    exam_config: Mapped[dict | None] = mapped_column(JSONB, default=None)
    is_active: Mapped[bool] = mapped_column(default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    topics = relationship("Topic", back_populates="course", lazy="selectin")
    cards = relationship("Card", back_populates="course", lazy="noload")


class Topic(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "topics"

    course_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False, index=True
    )
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("topics.id"), default=None
    )
    name: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    # 試験での出題比率 (%)
    weight_pct: Mapped[float] = mapped_column(Numeric(5, 2), default=0)
    level: Mapped[int] = mapped_column(Integer, default=0)  # 階層深さ (0=Part, 1=Domain, 2=Topic)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    course = relationship("Course", back_populates="topics")
    parent = relationship("Topic", remote_side="Topic.id", lazy="selectin")
    cards = relationship("Card", back_populates="topic", lazy="noload")
