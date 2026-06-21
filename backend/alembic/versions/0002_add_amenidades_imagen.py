"""add amenidades and imagen_url to room_types

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-23
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("room_types", sa.Column("imagen_url", sa.String(500), nullable=True))
    op.add_column("room_types", sa.Column("amenidades", postgresql.JSON(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    op.drop_column("room_types", "amenidades")
    op.drop_column("room_types", "imagen_url")
