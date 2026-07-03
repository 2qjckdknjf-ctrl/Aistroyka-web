# ROMA Merge Tracker

**Purpose:** Track ROMA QA Framework stages, branch ownership, commit/push/merge status, and exit verdicts.  
**Canonical stage plan:** `ROMA_ROADMAP.md` (this tracker mirrors it exactly).

**Branch:** `feature/roma-qa-framework`  
**Last updated:** 2026-07-03

| stage_id | stage_name | branch | status | committed | pushed | merged_to_main | exit_verdict | notes |
|----------|------------|--------|--------|-----------|--------|----------------|--------------|-------|
| 0 | Architecture baseline | `feature/roma-qa-framework` | DONE | YES | YES | NO | YES | 7 architecture docs + glossary |
| 0R | Stage 0 architecture review | `feature/roma-qa-framework` | DONE | YES | YES | NO | YES | `ROMA_STAGE0_REVIEW.md`; READY_FOR_STAGE1=YES |
| 1 | Core + inventory + reporting skeleton (governance) | `feature/roma-qa-framework` | DONE | YES | YES | NO | YES | ADRs 0001–0006, Core spec, PQS spec; runtime adapters pending Stage 1 exit |
| 2 | Intelligence layer (decision engine) | `feature/roma-qa-framework` | DONE | YES | NO | NO | YES | 13 docs in `intelligence/` + ADR-0007 + `ROMA_STAGE2_REVIEW.md` |
| 3 | Web + Backend + Security adapters | — | NOT STARTED | NO | NO | NO | — | Consumes Intelligence `run_plan`; absorb legacy e2e/smokes |
| 4 | Database + RBAC + AI adapters | — | NOT STARTED | NO | NO | NO | — | Fixture lifecycle, RBAC matrix, AI LIVE gate |
| 5 | Mobile (iOS + Android) integration | — | NOT STARTED | NO | NO | NO | — | UITest, Layer B, instrumented |
| 6 | Performance + Accessibility depth | — | NOT STARTED | NO | NO | NO | — | Budgets, a11y catalog |
| 7 | Observability + Chaos + Learning maturity | — | NOT STARTED | NO | NO | NO | — | buildStamp proof, chaos catalog, debt register |
| 8 | Council automation + dashboard (optional) | — | NOT STARTED | NO | NO | NO | — | workflow_dispatch, read-only dashboard |

## Legend

| Field | Values |
|-------|--------|
| `status` | NOT STARTED · IN_PROGRESS · DONE |
| `exit_verdict` | YES · NO · PENDING · — |
| `committed` / `pushed` / `merged_to_main` | YES · NO |

## Merge policy

- Each stage merges to `main` via protected PR only after `exit_verdict = YES`.
- `docs/roma/adr/` changes require architecture owner review.
- Generated run output lives under `docs/qa/` per ADR-0006 — not merged as part of stage docs unless explicitly versioned.

## Stage renumbering note (2026-07-03)

Stage 2 was redefined as **ROMA Intelligence** (architecture). Former roadmap stages 2–7 are now stages **3–8** in `ROMA_ROADMAP.md`.
