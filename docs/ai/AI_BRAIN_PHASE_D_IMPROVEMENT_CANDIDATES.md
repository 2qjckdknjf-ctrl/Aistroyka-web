# AI Brain Phase D — Improvement Candidates

## Overview

The improvement candidate layer converts eval and feedback findings into explicit, reviewable improvement suggestions. **Candidates are suggestions only** — no automatic production mutation.

## Design principles

- Suggestions only; no auto-merge
- Must link back to evidence (feedback, eval, run)
- Risk, readiness, reviewer metadata
- Review-gated: pending → approved/rejected

## Schema (ai_improvement_candidates)

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| tenant_id | uuid | Optional tenant scope |
| source | enum | feedback, eval, manual |
| target_layer | enum | prompt, policy, planner, tooling, output, memory_retrieval |
| rationale | text | Required |
| expected_gain | text | Optional |
| risk | text | Optional |
| readiness | text | draft, etc. |
| review_status | enum | pending, approved, rejected |
| linked_evidence_refs | jsonb | Evidence refs |
| created_at | timestamptz | |

## Linked evidence

- `{ type: "feedback", id: "..." }`
- `{ type: "eval", id: "evalRunId or caseId" }`
- `{ type: "run", id: "runId" }`

## Service API

- `createCandidate(supabase, input)` — Create candidate
- `getCandidates(supabase, options)` — List by tenant/review status
- `candidateFromEvalFailure(params)` — Helper to build input from eval failure

## Review status

- `pending` — Awaiting review
- `approved` — Reviewed and approved (still not auto-applied)
- `rejected` — Rejected

## Non-goals

- Automatic production mutation
- Auto-merge of prompt/policy changes
- Turning raw feedback into trusted truth automatically
