# Wave 4 Step 1 — Strict post-audit (Stage H)

**Classification:** FULL / PARTIAL / OPEN

| # | Item | Classification | Notes |
|---|------|----------------|-------|
| 1 | Milestone model | **FULL** | Persisted `project_milestones`; status enum migrated; TypeScript aligned |
| 2 | Task-to-milestone linkage | **FULL** | `worker_tasks.milestone_id`; existing task flows preserved |
| 3 | Schedule status / progress | **FULL** | Linked task counts, %, explicit statuses, signals on list API |
| 4 | Schedule pressure signals | **FULL** | Explainable codes + reasons; summary overdue; derived attention |
| 5 | Manager-facing milestone UX | **FULL** | Schedule tab panel + overview card + status update path |
| 6 | Integration into product surfaces | **PARTIAL** | Summary + UI card + AI assembler; **unified “Needs attention” feed does not yet list overdue from `/attention`** |
| 7 | Validation strength | **FULL** | Full Vitest + production build green this step |

## Remaining issues

| Priority | Issue |
|----------|--------|
| **P1** | Render **`attentionItems` from project summary** on project detail **or** extend **`/attention`** to include overdue milestones so one attention UX matches API-derived signals. |
| **P2** | i18n for schedule panel status labels; optional batch query for milestone list to avoid N+1 counts. |
| **P2** | E2E test for schedule tab happy path. |

**P0:** None identified for this step.

## Closure gate: next Wave 4 sub-step

| Question | Answer |
|----------|--------|
| Milestones only schema-level, not manager-usable? | **No** — manager UI is real. |
| Signals not explainable? | **No** — each has `reason`. |
| Validation skipped? | **No**. |
| **Wave 4 Step 1 closed enough to proceed?** | **YES** — with **P1** tracked for unified attention UX. |
