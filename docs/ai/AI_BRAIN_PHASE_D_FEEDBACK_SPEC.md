# AI Brain Phase D — Structured Feedback Spec

## Overview

The feedback layer captures structured feedback on AI outputs and plans in a machine-usable form. It is **not** a free-text comment box; scores and categories are required for downstream eval and improvement candidate generation.

## Design principles

- Structured over freeform
- Linkable to runs, actions, outputs
- Support human, system, and test feedback
- Validation at service boundary

## Schema

### Feedback record

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| run_id | uuid | FK to ai_run_records(id) |
| tenant_id | uuid | Tenant scope |
| source_kind | enum | human \| system \| test |
| reviewer_role | text | Optional role when source=human |
| feedback_category | text | Category (see below) |
| factuality_score | 0–5 | Optional |
| usefulness_score | 0–5 | Optional |
| safety_score | 0–5 | Optional |
| role_fit_score | 0–5 | Optional |
| completeness_score | 0–5 | Optional |
| comments | text | Optional structured notes |
| linked_refs | jsonb | Action/output/memory refs |
| created_at | timestamptz | |

### Feedback categories

- `factuality` — Output accuracy vs source truth
- `usefulness` — Practical value for the task
- `safety` — Client-safe, no inappropriate content
- `role_fit` — Appropriate for manager/worker/client
- `completeness` — Coverage of required aspects
- `action_relevance` — Action drafts relevant to context
- `memory_relevance` — Retrieved memory helpful
- `degradation_quality` — Behavior when data is partial

### Source kinds

- `human` — Manual reviewer
- `system` — Automated checks
- `test` — Eval-run or test harness

## Validation

- `runId` must reference an existing recorded run (ai_run_records.run_id).
- `sourceKind` and `feedbackCategory` must be from allowed sets.
- Scores must be 0–5 or absent.
- `linkedRefs` validated for `{ type, ref }` structure.

## Linking

Feedback links to:

- **Run** — Via run_id (required)
- **Action** — Via linked_refs `{ type: "action", ref: "..." }`
- **Output** — Via linked_refs `{ type: "output", ref: "..." }`
- **Memory** — Via linked_refs `{ type: "memory", ref: "..." }`

## Service API

- `submitFeedback(supabase, input)` — Validates, resolves run, inserts.
- `validateFeedbackCategory`, `validateSourceKind`, `validateScore`, `validateLinkedRefs` — Exported for route validation.

## Non-goals

- Free-text-only feedback
- Automatic merging of feedback into domain truth
- Feedback-driven auto-modification of prompts/policies
