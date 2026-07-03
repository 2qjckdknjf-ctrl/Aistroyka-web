# P1 — Approvals / Resubmit Flow Closure

**Date:** 2026-07-02  
**Area:** Task D — report approval semantics  
**Verdict:** **PARTIAL** (pilot-usable; one media resubmit limitation documented)

---

## Report status model

**Statuses:** `draft → submitted → approved | rejected | changes_requested`

- No ambiguous "reviewed" bucket — terminal states are explicit.
- Resubmit: worker/manager returns report to `submitted` via existing submit path from `changes_requested`.

Sources:
- `apps/web/lib/domain/reports/report.policy.ts`
- `apps/web/lib/domain/reports/report.service.ts`
- `PATCH /api/v1/reports/[id]` (manager review fields)

---

## Required semantics checklist

| # | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| 1 | Explicit approve | ✅ | PATCH `status: approved`; UI `ReportApprovalCard` |
| 2 | Explicit reject | ✅ | PATCH `status: rejected` + `manager_note` |
| 3 | Request changes | ✅ | PATCH `status: changes_requested` + note |
| 4 | Manager note/reason | ✅ | `manager_note` persisted |
| 5 | Worker resubmit after changes_requested | ⚠️ PARTIAL | Submit API works; **new media** requires draft-only `addMediaToReport` |
| 6 | Status history auditable | ✅ PARTIAL→FULL | **P1:** `insertReportApprovalEvent()` on submit + PATCH review |
| 7 | No hidden rejection semantics | ✅ | Distinct statuses in UI and API |

---

## P1 code changes

| Change | File |
|--------|------|
| Approval events on manager PATCH | `app/api/v1/reports/[id]/route.ts` |
| Approval events on submit/resubmit | `lib/domain/reports/report.service.ts` |
| Queue includes `changes_requested` reports | `pending-approvals.service.ts` |
| Fixed report `project_id` for queue (via task/day join) | `report-list.repository.ts` |
| Tests updated | `route.test.ts`, `report.service.task-link.test.ts`, `pending-approvals.service.test.ts` |

---

## Audit / history

| Store | Written (P1) | Read by history API |
|-------|--------------|---------------------|
| `report_approval_events` | ✅ submit, approve, reject, changes_requested | ⚠️ History route may still prefer `audit_logs` |
| `audit_logs` | ✅ via `emitAudit` | ✅ existing UI |

**Risk:** Low for pilot — events are persisted; UI history may not yet prefer events table.

---

## Resubmit limitation (P1 partial)

**Blocker class:** P2 backlog (not first-pilot blocker if workers edit text/comments only).

When report is `changes_requested`, worker can resubmit narrative fields but **`addMediaToReport` requires `draft` status** — adding new photos after manager request-changes may fail until status workflow extended.

**Owner action:** None for text-only resubmit pilots; for media-heavy rework, track as P2 fix.

---

## Closure verdict

**PARTIAL** — Core approve/reject/request-changes/resubmit semantics are explicit and queue-visible. Media append on resubmit remains open (P2). **Does not block P1 pilot closure** per mission ("complete enough for pilot operations").
