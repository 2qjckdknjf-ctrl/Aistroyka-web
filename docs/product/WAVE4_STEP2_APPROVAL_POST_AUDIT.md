# Wave 4 Step 2 — Strict post-audit (Stage H)

| # | Item | Classification | Notes |
|---|------|----------------|-------|
| 1 | Approval scope selection | **FULL** | Worker reports only; documents/milestones deferred with rationale |
| 2 | Approval model / state machine | **FULL** | Existing `worker_reports` states; transitions unchanged semantically |
| 3 | Backend workflow | **FULL** | PATCH review + submit/resubmit write append-only events |
| 4 | Approval history / auditability | **FULL** | `report_approval_events` + audit for ops; legacy GET fallback documented |
| 5 | Manager-facing approval UX | **FULL** | Queue, report detail actions, notes, project summary signals |
| 6 | Product integration | **PARTIAL** | Summary + project UI + brain; **not** merged into `/attention` API block |
| 7 | Validation strength | **FULL** | Full test suite + production build green |

## Issues

| Priority | Item |
|----------|------|
| **P1** | Project-filtered approval queue URL + client filter |
| **P2** | Optional SQL backfill from `audit_logs` into `report_approval_events` for historical parity |
| **P2** | i18n for approval labels |

**P0:** None identified.

## Closure gate

| Rule | Verdict |
|------|---------|
| Approvals only schema-level, not manager-usable? | **No** — queue + report detail are real. |
| Approval history weak/missing? | **No** — append-only table + API. |
| Validation skipped? | **No**. |

**Wave 4 Step 2 closed enough for next sub-step:** **YES** (with P1 for queue filtering).
