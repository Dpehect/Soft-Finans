"""Read-only, source-identity evaluation for the private Brain retriever.

Cases and reports contain no note bodies or answer text. Real case files should
stay local to the deployment: questions and source IDs can still be sensitive.
"""

from __future__ import annotations

from collections import defaultdict
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy.orm import Session

from backend.models.brain import BrainChunkORM
from backend.services.brain.indexer import _collect_chunks
from backend.services.brain.vector_store import VectorMatch

BrainSource = Literal["note", "journal", "portfolio", "holding", "transaction"]
Freshness = Literal["fresh", "source_missing", "index_missing", "index_stale"]


class EvidenceRef(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")

    source: BrainSource
    ref_id: str = Field(min_length=1, max_length=64)
    chunk_index: int | None = Field(default=None, ge=0)


class PrecedencePair(BaseModel):
    model_config = ConfigDict(extra="forbid")

    current: EvidenceRef
    historical: EvidenceRef


class RetrievalCase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=128)
    question: str = Field(min_length=1)
    k: int = Field(default=6, ge=1, le=20)
    sources: list[BrainSource] | None = None
    required_current: list[EvidenceRef] = Field(default_factory=list)
    required_history: list[EvidenceRef] = Field(default_factory=list)
    excluded: list[EvidenceRef] = Field(default_factory=list)
    precedence: list[PrecedencePair] = Field(default_factory=list)

    @model_validator(mode="after")
    def require_expectation(self) -> "RetrievalCase":
        if not (self.required_current or self.required_history or self.excluded or self.precedence):
            raise ValueError("a case needs at least one retrieval expectation")
        if self.sources is not None and not self.sources:
            raise ValueError("sources cannot be empty")
        return self


class RetrievalSuite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    version: Literal[1]
    cases: list[RetrievalCase] = Field(min_length=1)

    @model_validator(mode="after")
    def unique_case_ids(self) -> "RetrievalSuite":
        ids = [case.id for case in self.cases]
        if len(ids) != len(set(ids)):
            raise ValueError("case IDs must be unique")
        return self


def _source_key(ref: EvidenceRef) -> tuple[str, str]:
    return ref.source, ref.ref_id


def _match_identity(match: VectorMatch) -> tuple[str, str, int | None]:
    meta = match.chunk.meta_json or {}
    return (
        match.chunk.source,
        str(meta.get("source_ref_id", "")),
        meta.get("chunk_index"),
    )


def _position(ref: EvidenceRef, ranked: list[tuple[str, str, int | None]]) -> int | None:
    for position, (source, ref_id, chunk_index) in enumerate(ranked, start=1):
        if source == ref.source and ref_id == ref.ref_id and (
            ref.chunk_index is None or chunk_index == ref.chunk_index
        ):
            return position
    return None


def required_refs(case: RetrievalCase) -> set[EvidenceRef]:
    refs = set(case.required_current + case.required_history)
    for pair in case.precedence:
        refs.update((pair.current, pair.historical))
    return refs


def index_freshness(
    db: Session, user_id: str, refs: set[EvidenceRef], *, expected_dim: int | None = None
) -> dict[tuple[str, str], Freshness]:
    """Compare live owner records to stored chunk identities/vectors without reindexing."""
    source_refs: dict[str, set[str]] = defaultdict(set)
    for ref in refs:
        source_refs[ref.source].add(ref.ref_id)
    live = _collect_chunks(db, user_id, source_refs=dict(source_refs))
    indexed = db.query(BrainChunkORM).filter(BrainChunkORM.user_id == user_id).all()

    def identities(chunks: list[dict]) -> dict[tuple[str, str], dict[int, str]]:
        result: dict[tuple[str, str], dict[int, str]] = defaultdict(dict)
        for chunk in chunks:
            meta = chunk["meta_json"]
            key = chunk["source"], str(meta["source_ref_id"])
            if key in expected:
                result[key][int(meta["chunk_index"])] = chunk["content_hash"]
        return result

    expected = {_source_key(ref) for ref in refs}
    live_hashes = identities(live)
    index_hashes = identities([
        {
            "source": row.source,
            "meta_json": row.meta_json or {},
            "content_hash": row.content_hash,
        }
        for row in indexed
        if (row.source, str((row.meta_json or {}).get("source_ref_id", ""))) in expected
        and (row.meta_json or {}).get("chunk_index") is not None
    ])
    vector_ready: dict[tuple[str, str], dict[int, bool]] = defaultdict(dict)
    if expected_dim is not None:
        for row in indexed:
            meta = row.meta_json or {}
            key = row.source, str(meta.get("source_ref_id", ""))
            if key in expected and meta.get("chunk_index") is not None:
                vector_ready[key][int(meta["chunk_index"])] = (
                    row.dim == expected_dim and len(row.vector_json or []) == expected_dim
                )
    states: dict[tuple[str, str], Freshness] = {}
    for key in expected:
        current = live_hashes.get(key)
        stored = index_hashes.get(key)
        if not current:
            states[key] = "source_missing"
        elif not stored:
            states[key] = "index_missing"
        elif current != stored:
            states[key] = "index_stale"
        elif expected_dim is not None and not all(vector_ready[key].get(index, False) for index in current):
            states[key] = "index_stale"
        else:
            states[key] = "fresh"
    return states


def score_case(
    case: RetrievalCase,
    matches: list[VectorMatch],
    freshness: dict[tuple[str, str], Freshness],
) -> dict:
    ranked = [_match_identity(match) for match in matches]
    missing_current = [ref.model_dump() for ref in case.required_current if _position(ref, ranked) is None]
    missing_history = [ref.model_dump() for ref in case.required_history if _position(ref, ranked) is None]
    excluded_hits = [ref.model_dump() for ref in case.excluded if _position(ref, ranked) is not None]
    precedence_failures = [
        pair.model_dump()
        for pair in case.precedence
        if (
            _position(pair.current, ranked) is None
            or _position(pair.historical, ranked) is None
            or _position(pair.current, ranked) >= _position(pair.historical, ranked)
        )
    ]
    retrieval_pass = not (
        missing_current or missing_history or excluded_hits or precedence_failures
    )
    invalid_index = any(state != "fresh" for state in freshness.values())
    status = "invalid_index" if invalid_index else "pass" if retrieval_pass else "fail"
    return {
        "id": case.id,
        "status": status,
        "retrieval_pass": retrieval_pass,
        "required_current_hits": len(case.required_current) - len(missing_current),
        "required_current_total": len(case.required_current),
        "required_history_hits": len(case.required_history) - len(missing_history),
        "required_history_total": len(case.required_history),
        "missing_current": missing_current,
        "missing_history": missing_history,
        "excluded_hits": excluded_hits,
        "precedence_failures": precedence_failures,
        "index_freshness": {f"{source}:{ref_id}": state for (source, ref_id), state in sorted(freshness.items())},
        "ranked": [
            {"source": source, "ref_id": ref_id, "chunk_index": chunk_index, "score": round(match.score, 4)}
            for (source, ref_id, chunk_index), match in zip(ranked, matches)
        ],
    }


def summarize(results: list[dict]) -> dict:
    valid = [result for result in results if result["status"] != "invalid_index"]
    return {
        "cases": len(results),
        "evaluable": len(valid),
        "passed": sum(result["status"] == "pass" for result in valid),
        "failed": sum(result["status"] == "fail" for result in valid),
        "invalid_index": len(results) - len(valid),
        "current_recall": (
            sum(result["required_current_hits"] for result in valid),
            sum(result["required_current_total"] for result in valid),
        ),
        "history_recall": (
            sum(result["required_history_hits"] for result in valid),
            sum(result["required_history_total"] for result in valid),
        ),
    }
