"""Gamification models - XP, badges, daily missions"""

import uuid
from datetime import datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, SmallInteger, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class UserXP(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """ユーザーXPとレベル管理"""

    __tablename__ = "user_xp"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True, index=True
    )
    total_xp: Mapped[int] = mapped_column(Integer, default=0)
    level: Mapped[int] = mapped_column(SmallInteger, default=1)
    # 各資格別XP
    cia_xp: Mapped[int] = mapped_column(Integer, default=0)
    cisa_xp: Mapped[int] = mapped_column(Integer, default=0)
    cfe_xp: Mapped[int] = mapped_column(Integer, default=0)

    user = relationship("User", backref="xp_record")


class XPLog(UUIDPrimaryKeyMixin, Base):
    """XP獲得履歴"""

    __tablename__ = "xp_logs"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    source: Mapped[str] = mapped_column(String(50), nullable=False)
    # source: review_good, review_easy, streak_bonus, mission_complete, quiz_correct, synergy_bonus
    detail: Mapped[str | None] = mapped_column(String(255), default=None)
    earned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class Badge(UUIDPrimaryKeyMixin, Base):
    """バッジ定義マスター"""

    __tablename__ = "badges"

    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    icon: Mapped[str] = mapped_column(String(10), nullable=False)  # emoji
    category: Mapped[str] = mapped_column(String(30), nullable=False)
    # category: streak, mastery, volume, synergy, speed
    condition: Mapped[dict] = mapped_column(JSONB, nullable=False)
    # condition: {"type": "streak", "days": 7} or {"type": "reviews", "count": 100}
    xp_reward: Mapped[int] = mapped_column(Integer, default=50)


class UserBadge(UUIDPrimaryKeyMixin, Base):
    """ユーザー獲得バッジ"""

    __tablename__ = "user_badges"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    badge_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("badges.id"), nullable=False
    )
    earned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    badge = relationship("Badge", lazy="joined")


class DailyMission(UUIDPrimaryKeyMixin, Base):
    """デイリーミッション定義"""

    __tablename__ = "daily_missions"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    mission_date: Mapped[datetime] = mapped_column(Date, nullable=False)
    mission_type: Mapped[str] = mapped_column(String(50), nullable=False)
    # mission_type: review_cards, quiz_score, synergy_study, streak_maintain, speed_review
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    target_value: Mapped[int] = mapped_column(Integer, nullable=False)
    current_value: Mapped[int] = mapped_column(Integer, default=0)
    xp_reward: Mapped[int] = mapped_column(Integer, default=30)
    is_completed: Mapped[bool] = mapped_column(default=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
