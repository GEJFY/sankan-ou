"""add is_default to courses

Revision ID: a1b2c3d4e5f6
Revises: e34760f79b4b
Create Date: 2026-02-22 20:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'e34760f79b4b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('courses', sa.Column('is_default', sa.Boolean(), nullable=False, server_default=sa.text('false')))
    # CIA/CISA/CFE をデフォルト表示に設定
    op.execute("UPDATE courses SET is_default = true WHERE code IN ('CIA', 'CISA', 'CFE')")


def downgrade() -> None:
    op.drop_column('courses', 'is_default')
