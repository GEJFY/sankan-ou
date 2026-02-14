"""SynergyMapping model - 資格間知識重複"""

import uuid

from sqlalchemy import ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class SynergyMapping(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """資格間の知識重複マッピング"""

    __tablename__ = "synergy_mappings"

    topic_a_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("topics.id"), nullable=False, index=True
    )
    topic_b_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("topics.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    overlap_pct: Mapped[float] = mapped_column(Numeric(5, 2), default=0)
    # 用語対応 {"CIA": "内部統制", "CISA": "ITガバナンス", ...}
    term_mappings: Mapped[dict | None] = mapped_column(JSONB, default=None)
