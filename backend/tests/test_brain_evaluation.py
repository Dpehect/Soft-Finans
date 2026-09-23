"""Deterministic retrieval-score checks; no embedder, LLM, or private corpus."""

from __future__ import annotations

import json
from datetime import datetime, timezone

import pytest
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.models.brain import BrainChunkORM
from backend.models.notes import NoteORM
from backend.models.user import User
from backend.services.brain.brain_service import rank_brain_candidates
from backend.services.brain.evaluation import (
    RetrievalCase,
    RetrievalSuite,
    index_freshness,
    required_refs,
    score_case,
    summarize,
)
from backend.services.brain.indexer import _collect_chunks
from backend.services.brain.vector_store import VectorMatch


def _match(ref_id: str, score: float, when: str) -> VectorMatch:
    chunk = BrainChunkORM(
        source="note", ref_id=f"internal-{ref_id}", title=ref_id,
        meta_json={"source_ref_id": ref_id, "chunk_index": 0, "effective_at": when},
        chunk_text="Test evidence", content_hash="a" * 64,
    )
    return VectorMatch(chunk=chunk, score=score)


def test_case_score_catches_missed_history_unrelated_recency_and_wrong_order() -> None:
    case = RetrievalCase.model_validate({
        "id": "dated-thesis", "question": "Which margin thesis is current?", "k": 3,
        "required_current": [{"source": "note", "ref_id": "current"}],
        "required_history": [{"source": "note", "ref_id": "historical"}],
        "excluded": [{"source": "note", "ref_id": "unrelated"}],
        "precedence": [{
            "current": {"source": "note", "ref_id": "current"},
            "historical": {"source": "note", "ref_id": "historical"},
        }],
    })
    fresh = {("note", "current"): "fresh", ("note", "historical"): "fresh"}
    current = _match("current", 0.8, "2026-09-20T00:00:00Z")
    history = _match("historical", 0.81, "2025-01-01T00:00:00Z")
    unrelated = _match("unrelated", 0.2, "2026-09-21T00:00:00Z")

    passing = score_case(case, [current, history], fresh)
    assert passing["status"] == "pass"
    assert passing["required_current_hits"] == passing["required_history_hits"] == 1
    assert "Which margin thesis" not in json.dumps(passing)

    failing = score_case(case, [history, current, unrelated], fresh)
    assert failing["status"] == "fail"
    assert len(failing["excluded_hits"]) == 1
    assert len(failing["precedence_failures"]) == 1

    missing = score_case(case, [current], fresh)
    assert missing["status"] == "fail"
    assert len(missing["missing_history"]) == 1

    stale = score_case(case, [current, history], {**fresh, ("note", "current"): "index_stale"})
    assert stale["status"] == "invalid_index"
    assert summarize([passing, failing, stale]) == {
        "cases": 3, "evaluable": 2, "passed": 1, "failed": 1,
        "invalid_index": 1, "current_recall": (2, 2), "history_recall": (2, 2),
    }


def test_suite_validation_requires_named_expectations_and_unique_ids() -> None:
    with pytest.raises(ValidationError):
        RetrievalCase.model_validate({"id": "empty", "question": "What changed?"})
    case = {"id": "one", "question": "What changed?", "excluded": [{"source": "note", "ref_id": "wrong"}]}
    with pytest.raises(ValidationError):
        RetrievalSuite.model_validate({"version": 1, "cases": [case, case]})


def test_eval_uses_production_candidate_window_and_temporal_rerank() -> None:
    class Store:
        called: dict

        def search(self, _db, _user_id, _vector, **kwargs):
            self.called = kwargs
            return [
                _match("historical", 0.81, "2025-01-01T00:00:00Z"),
                _match("current", 0.78, "2026-09-20T00:00:00Z"),
            ]

    store = Store()
    matches = rank_brain_candidates(
        store, None, "owner", [1.0, 0.0], k=2, sources=["note"],
        now=datetime(2026, 9, 23, tzinfo=timezone.utc),
    )
    assert store.called == {"k": 20, "sources": ["note"]}
    assert [match.chunk.title for match in matches] == ["current", "historical"]


def test_freshness_distinguishes_missing_index_changed_index_and_missing_source() -> None:
    engine = create_engine("sqlite:///:memory:")
    User.__table__.create(engine)
    NoteORM.__table__.create(engine)
    BrainChunkORM.__table__.create(engine)
    db = sessionmaker(bind=engine)()
    try:
        note = NoteORM(user_id="owner", title="Margin view", body="Original view")
        db.add(note)
        db.commit()
        ref = RetrievalCase.model_validate({
            "id": "freshness", "question": "What changed?",
            "required_current": [{"source": "note", "ref_id": note.id}],
        })
        refs = required_refs(ref)
        key = ("note", note.id)
        assert index_freshness(db, "owner", refs)[key] == "index_missing"
        chunk = _collect_chunks(db, "owner", {"note": {note.id}})[0]
        db.add(BrainChunkORM(
            user_id="owner", source="note", ref_id=chunk["ref_id"],
            symbol=chunk["symbol"], title=chunk["title"],
            chunk_text=chunk["chunk_text"], meta_json=chunk["meta_json"],
            content_hash=chunk["content_hash"], dim=2, vector_json=[1.0, 0.0],
        ))
        db.commit()
        assert index_freshness(db, "owner", refs, expected_dim=2)[key] == "fresh"
        assert index_freshness(db, "owner", refs, expected_dim=3)[key] == "index_stale"
        stored = db.query(BrainChunkORM).filter(BrainChunkORM.user_id == "owner").one()
        stored.vector_json = []
        db.commit()
        assert index_freshness(db, "owner", refs, expected_dim=2)[key] == "index_stale"
        stored.vector_json = [1.0, 0.0]
        db.commit()
        note.body = "Corrected view"
        db.commit()
        assert index_freshness(db, "owner", refs)[key] == "index_stale"
        db.delete(note)
        db.commit()
        assert index_freshness(db, "owner", refs)[key] == "source_missing"
    finally:
        db.close()
        engine.dispose()
