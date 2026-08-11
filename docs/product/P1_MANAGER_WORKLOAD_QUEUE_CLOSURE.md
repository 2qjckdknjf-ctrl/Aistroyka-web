# P1 — Manager Workload Queue Closure

**Date:** 2026-07-02  
**Area:** Task E — unified manager action visibility  
**Verdict:** **FULL** for pilot operations

---

## Surfaces (reuse, no new giant dashboard)

| Surface | Path | Role |
|---------|------|------|
| Approvals page | `/dashboard/approvals` → `DashboardApprovalsClient.tsx` | Primary cross-project queue |
| Workload page | `/dashboard/workload` | Existing workload shell |
| Project summary | Project detail header counts | `pendingReportApprovalsCount` (fixed P1) |
| Project attention | `project-attention.repository.ts` | Per-project document + issue signals |
| API | `GET /api/v1/approvals/pending` | Unified feed |

---

## Queue item types (real data only)

| Item type | Status filter | Queue bucket | Link |
|-----------|---------------|--------------|------|
| Pending report approvals | `submitted` | `approval` | `/dashboard/reports/{id}` |
| Report follow-up | `changes_requested` | `follow_up` | `/dashboard/reports/{id}` |
| Pending document reviews | `under_review` | `approval` | `/dashboard/projects/{id}?tab=documents` |
| Document resubmission | `changes_requested` | `follow_up` | `/dashboard/projects/{id}?tab=documents` |

**Not included (no fake signals):**
- Overdue/at-risk unless derived from existing fields (not added in P1)
- AI recommendations

---

## Item fields shown

| Field | Implemented |
|-------|-------------|
| Title | ✅ document title or report id prefix |
| Entity type | ✅ report vs document badge |
| Status | ✅ raw status + queue badge |
| Reason | ✅ `reason` string (P1) |
| Priority/severity | ⚠️ age only (`formatAge`); no synthetic priority |
| Direct link | ✅ |
| Empty state | ✅ `EmptyState` with link to all reports |

---

## P1 bug fix (critical)

**Problem:** `worker_reports` has **no `project_id` column**; prior queue/summary queries used it directly → empty/wrong counts.

**Fix:**
- `enrichReportsWithProjectId()` via `task_id` / `worker_day` joins in `report-list.repository.ts`
- `listReportsByStatusesForManager()` for queue
- `countSubmittedReportsForProject()` in project summary

---

## Partial gap (non-blocking)

`project-attention.repository.ts` still lists **documents + issues only**, not pending **reports**. Cross-project queue and project summary count cover report approvals; per-project attention widget may under-report report pending items.

**Classification:** P2 polish — does not block manager opening dashboard and seeing work (approvals page is primary).

---

## Tests

- `pending-approvals.service.test.ts` — report + document merge, sort, queue buckets

---

## Closure verdict

**FULL** — Manager can open `/dashboard/approvals` and see grounded pending/follow-up items with direct links.
