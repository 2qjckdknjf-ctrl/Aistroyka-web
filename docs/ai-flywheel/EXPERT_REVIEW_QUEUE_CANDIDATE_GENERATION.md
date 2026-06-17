# Expert Review Queue Candidate Generation

**Script:** `scripts/ai/build-expert-review-queue.ts`

## Sources (MVP)

| Source | Loader |
|--------|--------|
| `ai_preference_pairs` | non-low-value pairs |
| `ai_feedback_records` | factuality/usefulness ≤ 2 |
| manual fixtures | dry-run default |

## Pipeline

PII scrub → verifier → finance guard → dedupe by `(source_table, source_id)` → insert if write flag + `--write`.

## Live state

**DATA_SUPPLY_EMPTY** — 0 preference pairs, 0 feedback records on AISTROYKA live DB.
