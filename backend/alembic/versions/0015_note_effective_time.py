"""add effective time to private notes

Revision ID: 0015_note_effective_time
Revises: 0014_ledger_currency
Create Date: 2026-09-16

The timestamp is nullable and deliberately not backfilled: existing notes fall
back to their update/creation timestamps in the Second Brain index. External
pipelines can set it for source material whose publication time differs from
its ingestion time.
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "0015_note_effective_time"
down_revision = "0014_ledger_currency"
branch_labels = None
depends_on = None


def _columns(table_name: str) -> set[str]:
    inspector = sa.inspect(op.get_bind())
    if table_name not in set(inspector.get_table_names()):
        return set()
    return {str(column["name"]) for column in inspector.get_columns(table_name)}


def upgrade() -> None:
    note_columns = _columns("notes")
    if note_columns and "effective_at" not in note_columns:
        op.add_column(
            "notes",
            sa.Column("effective_at", sa.DateTime(timezone=True), nullable=True),
        )
        op.create_index("ix_notes_effective_at", "notes", ["effective_at"], unique=False)


def downgrade() -> None:
    # Preserve temporal evidence across application-version rollbacks. The
    # idempotent upgrade remains safe when the newer version returns.
    pass
