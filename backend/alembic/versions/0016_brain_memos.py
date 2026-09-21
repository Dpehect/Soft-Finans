"""add owner-scoped Second Brain research memos

Revision ID: 0016_brain_memos
Revises: 0015_note_effective_time
Create Date: 2026-09-21

The synthesis snapshot is immutable at the API layer and deliberately separate
from ``brain_chunks``: saved model output must not become retrieval evidence by
default.  Organization fields remain editable by the owning user.
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "0016_brain_memos"
down_revision = "0015_note_effective_time"
branch_labels = None
depends_on = None


def _tables() -> set[str]:
    return set(sa.inspect(op.get_bind()).get_table_names())


def _indexes(table_name: str) -> set[str]:
    if table_name not in _tables():
        return set()
    return {str(index["name"]) for index in sa.inspect(op.get_bind()).get_indexes(table_name)}


def upgrade() -> None:
    if "brain_memos" not in _tables():
        op.create_table(
            "brain_memos",
            sa.Column("id", sa.String(length=36), nullable=False),
            sa.Column("user_id", sa.String(length=36), nullable=False),
            sa.Column("question", sa.Text(), nullable=False),
            sa.Column("answer", sa.Text(), nullable=False),
            sa.Column("sources", sa.JSON(), nullable=False),
            sa.Column("citations", sa.JSON(), nullable=False),
            sa.Column("generated_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("llm", sa.Boolean(), nullable=True),
            sa.Column("llm_provider", sa.String(length=128), nullable=True),
            sa.Column("llm_model", sa.String(length=256), nullable=True),
            sa.Column("title", sa.String(length=256), nullable=False),
            sa.Column("tags", sa.JSON(), nullable=False),
            sa.Column("annotation", sa.Text(), nullable=False),
            sa.Column("symbol", sa.String(length=64), nullable=True),
            sa.Column("pinned", sa.Boolean(), nullable=False),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )

    existing_indexes = _indexes("brain_memos")
    for name, columns in (
        ("ix_brain_memos_user_id", ["user_id"]),
        ("ix_brain_memos_symbol", ["symbol"]),
        ("ix_brain_memos_pinned", ["pinned"]),
        ("ix_brain_memos_generated_at", ["generated_at"]),
        ("ix_brain_memos_created_at", ["created_at"]),
        ("ix_brain_memos_user_pinned_created", ["user_id", "pinned", "created_at"]),
    ):
        if name not in existing_indexes:
            op.create_index(name, "brain_memos", columns, unique=False)


def downgrade() -> None:
    # Preserve private research across application-version rollbacks. The
    # idempotent upgrade remains safe when the newer version returns.
    pass
