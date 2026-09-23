# Private Second Brain retrieval evaluation

The Second Brain's time-aware retrieval needs measured cases from the growing
Hermes corpus. This runner scores **retrieval only**: it does not call the chat
model, rewrite notes, reindex, or change database records. Keep real questions,
source IDs, and reports outside Git; all can reveal private research.

## Make a reviewed case file

Use the actual source IDs returned in Brain citations (`ref_id`). For a long
source, optionally pin a specific zero-based `chunk_index`; without it, any
chunk from that source satisfies the expectation. Dates belong in the source
Notes' `effective_at` fields, not in this case file. The example IDs below are
placeholders and will not match a real corpus.

```json
{
  "version": 1,
  "cases": [
    {
      "id": "margin-thesis-current-vs-history",
      "question": "What is my current margin thesis, and what changed?",
      "k": 6,
      "sources": ["note", "journal"],
      "required_current": [{"source": "note", "ref_id": "CURRENT_NOTE_ID"}],
      "required_history": [{"source": "note", "ref_id": "OLDER_NOTE_ID"}],
      "excluded": [{"source": "note", "ref_id": "UNRELATED_RECENT_NOTE_ID"}],
      "precedence": [
        {
          "current": {"source": "note", "ref_id": "CURRENT_NOTE_ID"},
          "historical": {"source": "note", "ref_id": "OLDER_NOTE_ID"}
        }
      ]
    }
  ]
}
```

`required_current` and `required_history` must appear in the top `k` results.
`excluded` must not appear. A `precedence` pair additionally requires the
current source above its historical counterpart. Give each case a stable,
non-sensitive ID so results can be compared between code versions. Start with
dated current/history pairs, ambiguous chronology, and recent unrelated
distractors; add source-specific cases before changing decay weights.

## Run against the private indexed corpus

Run where the real owner's database and configured embedding provider are
available, with a private case file **outside this repository**, such as
`../brain-eval-cases.json`:

```bash
PYTHONPATH=. backend/.venv/bin/python scripts/evaluate_brain_retrieval.py \
  --cases ../brain-eval-cases.json --user-email you@example.com
```

The runner prints JSON with case-level ranked **identities and scores**, not
note bodies or the case questions. It still contains private source IDs; keep
the output private. Use `--user-id` instead of `--user-email` when convenient.
The command exits `0` when all evaluable cases pass, `1` on retrieval failures,
and `2` for invalid cases, unavailable embeddings, or stale/missing expected
index records. A case with stale or missing expected index records is marked
`invalid_index`, not counted as a retrieval failure. This includes missing or
wrong-dimension stored vectors after an embedding-model change; refresh indexing first and
rerun. The report separates current and historical recall and lists excluded
hits and precedence failures.

The freshness check compares live source identities and stored vector presence
and dimensions. It cannot detect a switch to a different embedding model with
the **same dimension**, because the current index does not record a model ID per
chunk. Reindex after changing the embedding model before trusting a comparison.

The runner uses existing stored vectors, production candidate-window sizing,
and temporal reranking. It tries read-only pgvector search on PostgreSQL and
falls back to exact in-process cosine search if necessary. It does **not**
evaluate the LLM's final answer, whether retrieved claims are true, or
time-travel to an earlier corpus snapshot. Do not tune topic identity,
source-specific decay, diversity, or supersession prompts from synthetic tests
alone; first review failures on real cases and note which stage caused each one.
