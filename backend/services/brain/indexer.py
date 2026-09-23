"""Gather a user's own writing, embed it, and keep the brain index in sync.

Sources (all per-user, all authored by the user themselves):
  * journal entries — the trade narrative + emotion/strategy/setup/notes
  * portfolio descriptions — the portfolio-level thesis
  * per-holding notes — why this position is held
  * transaction notes — the rationale captured at decision time

Short records become one chunk; long records are split deterministically into
lightly overlapping chunks. Re-indexing is incremental: unchanged chunks (same
stable identity and content hash) are skipped, and stale chunks are pruned.
"""

from __future__ import annotations

import hashlib
import json
import logging
from datetime import date, datetime
from typing import Any

from sqlalchemy.orm import Session

from backend.models.brain import BrainChunkORM  # noqa: F401 - ensures table registered
from backend.models.core import (
    PortfolioHoldingORM,
    PortfolioORM,
    PortfolioTransactionORM,
)
from backend.models.journal import JournalEntry
from backend.models.notes import NoteORM
from backend.services.brain.vector_store import VectorStore, make_vector_store
from backend.services.embeddings import get_embedding_service
from backend.shared.db import engine

logger = logging.getLogger(__name__)

CHUNK_MAX_CHARS = 1200
CHUNK_OVERLAP_CHARS = 160
_CHUNK_MIN_BREAK_FRACTION = 0.6


def _hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _split_text(
    text: str,
    *,
    max_chars: int = CHUNK_MAX_CHARS,
    overlap_chars: int = CHUNK_OVERLAP_CHARS,
) -> list[str]:
    """Split text deterministically, preferring readable boundaries.

    Chunks are character-bounded so the behaviour is independent of the active
    embedding model/tokenizer. Paragraph and sentence endings are preferred;
    long unbroken text falls back to a hard boundary. The next chunk starts near
    ``overlap_chars`` before the previous end, aligned to whitespace when
    possible.
    """
    text = (text or "").strip()
    if not text:
        return []
    if max_chars <= 0:
        raise ValueError("max_chars must be positive")
    if overlap_chars < 0 or overlap_chars >= max_chars:
        raise ValueError("overlap_chars must be between 0 and max_chars - 1")
    if len(text) <= max_chars:
        return [text]

    chunks: list[str] = []
    start = 0
    while start < len(text):
        hard_end = min(start + max_chars, len(text))
        end = hard_end
        if hard_end < len(text):
            min_end = start + int(max_chars * _CHUNK_MIN_BREAK_FRACTION)
            for separator in ("\n\n", "\n", ". ", "? ", "! ", "; ", ", ", " "):
                boundary = text.rfind(separator, min_end, hard_end)
                if boundary >= min_end:
                    end = boundary + len(separator)
                    break

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= len(text):
            break

        next_start = max(start + 1, end - overlap_chars)
        while next_start < end and not text[next_start].isspace():
            next_start += 1
        while next_start < len(text) and text[next_start].isspace():
            next_start += 1
        start = next_start if next_start < end else end

    return chunks


def _chunk_ref_id(source: str, source_ref_id: Any, chunk_index: int) -> str:
    """Return a stable internal row key without exposing it as the citation ID."""
    return _hash(f"{source}\0{source_ref_id}\0{chunk_index}")


def _build_chunks(
    *,
    source: str,
    source_ref_id: Any,
    symbol: str | None,
    title: str,
    text: str,
    meta_json: dict[str, Any],
) -> list[dict[str, Any]]:
    """Build persistable chunks while retaining the original citation identity."""
    out: list[dict[str, Any]] = []
    for chunk_index, chunk_text in enumerate(_split_text(text)):
        meta = dict(meta_json)
        meta.update({"source_ref_id": str(source_ref_id), "chunk_index": chunk_index})
        # Citation metadata is part of the persisted record. Including it in the
        # hash makes route/title corrections propagate on the next reindex even
        # when the text (and therefore its semantic embedding) is unchanged.
        content_identity = json.dumps(
            {"text": chunk_text, "title": title, "symbol": symbol, "meta": meta},
            sort_keys=True,
            separators=(",", ":"),
            default=str,
        )
        out.append(
            {
                "source": source,
                "ref_id": _chunk_ref_id(source, source_ref_id, chunk_index),
                "symbol": symbol,
                "title": title,
                "chunk_text": chunk_text,
                "content_hash": _hash(content_identity),
                "meta_json": meta,
            }
        )
    return out


def _fmt_num(value: Any) -> str:
    if value is None:
        return "?"
    try:
        return f"{float(value):,.2f}"
    except (TypeError, ValueError):
        return str(value)


def _iso_timestamp(value: Any) -> str | None:
    """Return a stable temporal value for prompt/ranking metadata."""
    if value is None:
        return None
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    normalized = str(value).strip()
    return normalized or None


def _temporal_meta(
    *,
    effective_at: Any = None,
    recorded_at: Any = None,
    updated_at: Any = None,
) -> dict[str, str]:
    out: dict[str, str] = {}
    for key, value in (
        ("effective_at", effective_at),
        ("recorded_at", recorded_at),
        ("updated_at", updated_at),
    ):
        normalized = _iso_timestamp(value)
        if normalized:
            out[key] = normalized
    return out


def _journal_text(row: JournalEntry) -> str:
    parts: list[str] = []
    when = row.entry_date.date().isoformat() if row.entry_date else "?"
    parts.append(f"Trade journal — {row.direction} {row.symbol} entered {when}.")
    if row.exit_date or row.pnl is not None:
        outcome = "win" if (row.pnl or 0) > 0 else "loss" if (row.pnl or 0) < 0 else "flat"
        parts.append(
            f"Outcome: {outcome}, P&L {_fmt_num(row.pnl)} ({_fmt_num(row.pnl_pct)}%)."
        )
    if row.strategy:
        parts.append(f"Strategy: {row.strategy}.")
    if row.setup:
        parts.append(f"Setup: {row.setup}.")
    if row.emotion:
        parts.append(f"Emotion at the time: {row.emotion}.")
    if row.rating is not None:
        parts.append(f"Self-rating: {row.rating}/5.")
    if row.tags:
        parts.append("Tags: " + ", ".join(str(t) for t in row.tags) + ".")
    if row.notes:
        parts.append(f"Notes: {row.notes.strip()}")
    return " ".join(parts)


_NOTE_CONTEXT_LABELS = {
    "general": "Note",
    "security": "Note",
    "watchlist": "Watchlist note",
    "news": "News note",
    "holding": "Position note",
    "transaction": "Transaction note",
    "brain_memo": "Promoted research note",
}

# A note's context maps to a route the citation can deep-link to.
_NOTE_CONTEXT_ROUTES = {
    "brain_memo": "/equity/notes",
    "watchlist": "/equity/watchlist",
    "news": "/equity/news",
    "holding": "/equity/portfolio",
    "transaction": "/equity/portfolio",
}


def _collect_chunks(
    db: Session, user_id: str, source_refs: dict[str, set[str]] | None = None
) -> list[dict]:
    """Build live evidence identities, optionally limited to cited source IDs."""
    chunks: list[dict] = []

    def wants(source: str) -> bool:
        return source_refs is None or bool(source_refs.get(source))

    # 0. Free-form notes — the frictionless capture layer (Notes hub + per-symbol
    #    composers on security/watchlist/news/portfolio). The richest brain source.
    note_query = db.query(NoteORM).filter(NoteORM.user_id == user_id)
    if source_refs is not None:
        note_query = note_query.filter(NoteORM.id.in_(source_refs.get("note", set())))
    for row in note_query.all() if wants("note") else []:
        body = (row.body or "").strip()
        if not body:
            continue
        label = _NOTE_CONTEXT_LABELS.get(row.context, "Note")
        sym = (row.symbol or "").strip()
        heading = " ".join(p for p in [label, "·", sym, (row.title or "").strip()] if p).strip(" ·")
        text = f"{label}{f' on {sym}' if sym else ''}: "
        if row.title:
            text += f"{row.title.strip()} — "
        text += body
        if row.tags:
            text += " Tags: " + ", ".join(str(t) for t in row.tags) + "."
        route = _NOTE_CONTEXT_ROUTES.get(row.context)
        if row.context in ("security", "general") and sym:
            route = f"/equity/security/{sym}"
        recorded_at = getattr(row, "created_at", None)
        updated_at = getattr(row, "updated_at", None)
        effective_at = getattr(row, "effective_at", None) or updated_at or recorded_at
        chunks.extend(
            _build_chunks(
                source="note",
                source_ref_id=row.id,
                symbol=sym or None,
                title=heading or "Note",
                text=text,
                meta_json={
                    "context": row.context,
                    "symbol": sym or None,
                    "route": route,
                    **_temporal_meta(
                        effective_at=effective_at,
                        recorded_at=recorded_at,
                        updated_at=updated_at,
                    ),
                },
            )
        )

    # 1. Journal entries — always embed (structured context is meaningful even without notes).
    journal_query = db.query(JournalEntry).filter(JournalEntry.user_id == user_id)
    if source_refs is not None:
        journal_ids = []
        for ref in source_refs.get("journal", set()):
            try:
                journal_ids.append(int(ref))
            except ValueError:
                continue
        journal_query = journal_query.filter(JournalEntry.id.in_(journal_ids))
    for row in journal_query.all() if wants("journal") else []:
        text = _journal_text(row)
        when = row.entry_date.date().isoformat() if row.entry_date else ""
        chunks.extend(
            _build_chunks(
                source="journal",
                source_ref_id=row.id,
                symbol=row.symbol,
                title=f"Journal · {row.direction} {row.symbol} {when}".strip(),
                text=text,
                meta_json={
                    "emotion": row.emotion,
                    "strategy": row.strategy,
                    "setup": row.setup,
                    "pnl": row.pnl,
                    "date": when,
                    "route": "/equity/journal",
                    **_temporal_meta(
                        effective_at=row.entry_date,
                        recorded_at=getattr(row, "created_at", None),
                        updated_at=getattr(row, "updated_at", None),
                    ),
                },
            )
        )

    # User's portfolios (the join key for holding/transaction notes below).
    portfolios = (
        db.query(PortfolioORM).filter(PortfolioORM.user_id == user_id).all()
        if any(wants(source) for source in ("portfolio", "holding", "transaction"))
        else []
    )
    portfolio_ids = [p.id for p in portfolios]

    # 2. Portfolio theses (description).
    for p in portfolios:
        if source_refs is not None and p.id not in source_refs.get("portfolio", set()):
            continue
        desc = (p.description or "").strip()
        if not desc:
            continue
        text = f"Portfolio thesis — {p.name}: {desc}"
        chunks.extend(
            _build_chunks(
                source="portfolio",
                source_ref_id=p.id,
                symbol=None,
                title=f"Portfolio · {p.name}",
                text=text,
                meta_json={
                    "portfolio": p.name,
                    "route": "/equity/portfolio",
                    **_temporal_meta(
                        effective_at=getattr(p, "created_at", None),
                        recorded_at=getattr(p, "created_at", None),
                    ),
                },
            )
        )

    if portfolio_ids:
        # 3. Per-holding notes.
        holding_query = db.query(PortfolioHoldingORM).filter(
            PortfolioHoldingORM.portfolio_id.in_(portfolio_ids)
        )
        if source_refs is not None:
            holding_query = holding_query.filter(PortfolioHoldingORM.id.in_(source_refs.get("holding", set())))
        holdings = holding_query.all() if wants("holding") else []
        for h in holdings:
            note = (h.notes or "").strip()
            if not note:
                continue
            text = f"Position note — {h.symbol}: {note}"
            chunks.extend(
                _build_chunks(
                    source="holding",
                    source_ref_id=h.id,
                    symbol=h.symbol,
                    title=f"Position · {h.symbol}",
                    text=text,
                    meta_json={
                        "symbol": h.symbol,
                        "route": "/equity/portfolio",
                        **_temporal_meta(
                            effective_at=getattr(h, "created_at", None),
                            recorded_at=getattr(h, "created_at", None),
                        ),
                    },
                )
            )

        # 4. Transaction notes.
        txn_query = db.query(PortfolioTransactionORM).filter(
            PortfolioTransactionORM.portfolio_id.in_(portfolio_ids)
        )
        if source_refs is not None:
            txn_query = txn_query.filter(PortfolioTransactionORM.id.in_(source_refs.get("transaction", set())))
        txns = txn_query.all() if wants("transaction") else []
        for t in txns:
            note = (t.notes or "").strip()
            if not note:
                continue
            text = f"Transaction note — {t.type} {t.symbol} on {t.date}: {note}"
            chunks.extend(
                _build_chunks(
                    source="transaction",
                    source_ref_id=t.id,
                    symbol=t.symbol,
                    title=f"Transaction · {t.type} {t.symbol}",
                    text=text,
                    meta_json={
                        "symbol": t.symbol,
                        "type": t.type,
                        "date": t.date,
                        "route": "/equity/portfolio",
                        **_temporal_meta(
                            effective_at=t.date,
                            recorded_at=getattr(t, "created_at", None),
                        ),
                    },
                )
            )

    return chunks


async def reindex_user(db: Session, user_id: str) -> dict:
    """(Re)build the brain index for one user. Incremental + prunes stale rows."""
    chunks = _collect_chunks(db, user_id)
    embedder = get_embedding_service()
    store: VectorStore = make_vector_store(engine, embedder.dim)

    written = 0
    pending = store.pending_chunks(db, user_id, chunks, dim=embedder.dim)
    if pending:
        vectors = await embedder.embed_texts([c["chunk_text"] for c in pending])
        for chunk, vector in zip(pending, vectors):
            chunk["vector"] = vector
        written = store.upsert(db, user_id, pending)

    # Prune only after replacement chunks have been embedded and persisted. On
    # the first v1.3 reindex this keeps the legacy one-row index usable if the
    # embedding provider fails midway through migration.
    keep = {(c["source"], str(c["ref_id"])) for c in chunks}
    removed = store.delete_missing(db, user_id, keep)

    total = store.count(db, user_id)
    source_count = len(
        {(c["source"], str(c["meta_json"]["source_ref_id"])) for c in chunks}
    )
    return {
        "indexed": written,
        "removed": removed,
        "total": total,
        "backend": "pgvector" if store.use_pgvector else "numpy",
        "dim": embedder.dim,
        "sources": source_count,
    }
