#!/usr/bin/env python3
"""Score private, dated Second Brain retrieval cases without calling the LLM.

Uses existing embeddings/index rows and the production candidate/rerank path.
It performs no reindex or database writes. Keep real case files and reports
outside version control: questions and source IDs may be sensitive.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path

from pydantic import ValidationError
from sqlalchemy import inspect

from backend.models.user import User
from backend.services.brain.brain_service import rank_brain_candidates
from backend.services.brain.evaluation import (
    RetrievalSuite,
    index_freshness,
    required_refs,
    score_case,
    summarize,
)
from backend.services.brain.vector_store import VectorStore
from backend.services.embeddings import EmbeddingError, get_embedding_service
from backend.shared.db import SessionLocal, engine


async def evaluate(suite: RetrievalSuite, user_id: str) -> dict:
    embedder = get_embedding_service()
    # Constructor only; make_vector_store may initialize pgvector DDL, which an
    # evaluation must not do. Search itself is read-only and falls back to numpy.
    store = VectorStore(use_pgvector=engine.dialect.name == "postgresql")
    results: list[dict] = []
    with SessionLocal() as db:
        if store.count(db, user_id) == 0:
            raise ValueError("selected owner has no indexed Brain chunks")
        for case in suite.cases:
            vector = await embedder.embed_query(case.question)
            matches = rank_brain_candidates(
                store, db, user_id, vector, k=case.k, sources=case.sources
            )
            freshness = index_freshness(db, user_id, required_refs(case), expected_dim=embedder.dim)
            results.append(score_case(case, matches, freshness))
    return {"summary": summarize(results), "cases": results}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cases", type=Path, required=True, help="Private JSON case file")
    identity = parser.add_mutually_exclusive_group(required=True)
    identity.add_argument("--user-id", help="Owner ID of the indexed private corpus")
    identity.add_argument("--user-email", help="Look up the corpus owner by email")
    args = parser.parse_args()

    try:
        suite = RetrievalSuite.model_validate(json.loads(args.cases.read_text(encoding="utf-8")))
    except (OSError, ValueError, ValidationError) as exc:
        print(f"Invalid case file: {exc}", file=sys.stderr)
        return 2

    if not inspect(engine).has_table("brain_chunks"):
        print("No Brain index table in the selected database; check DATABASE_URL.", file=sys.stderr)
        return 2
    with SessionLocal() as db:
        query = db.query(User)
        user = query.filter(User.id == args.user_id).first() if args.user_id else query.filter(User.email == args.user_email).first()
        if user is None:
            print("Corpus owner not found in the selected database.", file=sys.stderr)
            return 2
        user_id = user.id

    try:
        report = asyncio.run(evaluate(suite, user_id))
    except (EmbeddingError, ValueError) as exc:
        print(f"Evaluation unavailable: {exc}", file=sys.stderr)
        return 2
    print(json.dumps(report, indent=2))
    summary = report["summary"]
    if summary["invalid_index"] or not summary["evaluable"]:
        return 2
    return 0 if summary["failed"] == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
