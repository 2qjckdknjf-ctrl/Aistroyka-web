# AI Brain Phase D — Eval Case Registry

## Overview

The eval case registry stores typed golden eval cases used to evaluate AI Brain behavior. Cases support tags, mode targeting, activation/deactivation, and grading strategy metadata.

## Golden eval cases (minimum coverage)

1. **Executive summary quality** — project_brief, executive_summary
2. **Project intelligence grounding** — project_brief, project_intelligence
3. **Manager action draft usefulness** — action_plan, manager_assist
4. **Worker assist usefulness** — action_plan, worker_assist
5. **Client-safe summary safety** — project_brief, client_safe_summary
6. **Memory-assisted retrieval quality** — action_plan, manager_assist
7. **Degradation when data partial** — project_brief, executive_summary
8. **Refusal when modules incomplete** — project_brief, client_safe_summary

## Schema (ai_eval_cases)

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| title | text | Case title |
| scenario_type | text | project_brief, action_plan, etc. |
| mode | text | Orchestrator mode |
| required_inputs | jsonb | Input requirements |
| expected_assertions | jsonb | Assertions for grading |
| grading_strategy | text | strict, lenient, weighted |
| tags | text[] | Tags for filtering |
| active | boolean | Whether case is active |
| created_at | timestamptz | |

## Assertion types

- `contains` — Path must contain value
- `schema` — Output must match schema at path
- `score` — Min score threshold
- `refusal` — Expected refusal/withholding
- `degradation` — Expected degradation flags

## Registry API

- `listEvalCases(supabase, options)` — Loads from DB when available; falls back to in-memory seed cases.
- Options: `mode`, `active`, `tags`

## Storage

- Primary: `ai_eval_cases` table (Supabase)
- Fallback: In-memory `SEED_EVAL_CASES` when DB empty or unavailable
- Seed migration: `20260323130100_ai_eval_seed_cases.sql`
