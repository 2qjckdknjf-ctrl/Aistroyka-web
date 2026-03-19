# Step 13A — Gap Review

## 1. Task assignments–only attribution gap

| Field | Value |
|-------|--------|
| **Issue** | Manager task list filter by `assigned_to` only considers `worker_tasks.assigned_to`. Tasks assigned solely via `task_assignments` (e.g. multi-assign or legacy path) are excluded. |
| **Impact** | Manager may miss contractor work; contractor-scoped view is incomplete. |
| **Severity** | High (data truth gap). |
| **Fix now / defer** | Fix now. |
| **Blocker status** | Yes for closure. |

---

## 2. Manager project-level contractor visibility gap

| Field | Value |
|-------|--------|
| **Issue** | No dedicated project-level contractor surface. API supports `?role=contractor` on project workers, but project UI has no Contractors tab or panel; contractors are only visible in the generic Workers tab. |
| **Impact** | Manager cannot see contractor-specific context at project level without filtering mentally or via tasks/reports. |
| **Severity** | Medium (visibility/usability). |
| **Fix now / defer** | Fix now. |
| **Blocker status** | Yes for closure. |

---

## 3. Contractor summary usefulness gap

| Field | Value |
|-------|--------|
| **Issue** | Worker summary has tasks_assigned, tasks_overdue, reports_count but no “pending review” or other attention cue for reports awaiting manager action. |
| **Impact** | Manager has to open reports list to see what needs review; contractor summary is less actionable. |
| **Severity** | Low–medium. |
| **Fix now / defer** | Fix now (lightweight). |
| **Blocker status** | No (enhancement). |

---

## 4. Contractor action/attention visibility gap

| Field | Value |
|-------|--------|
| **Issue** | No integration with existing action/attention surfaces (e.g. ops overview, notifications) for “contractor overdue” or “contractor reports pending review.” |
| **Impact** | Contractor-related attention is only visible when manager drills into worker/project/tasks/reports. |
| **Severity** | Low. |
| **Fix now / defer** | Defer (lightweight doc only) or minimal: add grounded counts to worker summary so drill-down is clearer. |
| **Blocker status** | No. |

---

## 5. Test/validation confidence gap

| Field | Value |
|-------|--------|
| **Issue** | Step 13 validation could not run full test suite (esbuild/platform). No deterministic test for task_assignments-inclusive list or for contractor project listing. |
| **Impact** | Regression risk; closure confidence weaker. |
| **Severity** | Medium. |
| **Fix now / defer** | Fix now: add focused tests; document reliable validation path. |
| **Blocker status** | Yes for closure. |

---

## 6. Weak wording / dead-end navigation

| Field | Value |
|-------|--------|
| **Issue** | Worker detail “Tasks assigned to this worker” and “View all reports” are clear; project Workers tab does not distinguish contractor vs worker in label or offer “Contractors only” entry point. |
| **Impact** | Minor confusion; contractor visibility not explicit at project level. |
| **Severity** | Low. |
| **Fix now / defer** | Fix now (add Contractors tab). |
| **Blocker status** | No. |

---

## Summary

| Gap | Fix now | Deferred | Blocker |
|-----|---------|----------|---------|
| Task assignments–only attribution | ✓ | — | Yes |
| Project-level contractor surface | ✓ | — | Yes |
| Contractor summary usefulness | ✓ (reports_pending_review) | — | No |
| Action/attention visibility | — | ✓ | No |
| Test/validation confidence | ✓ | — | Yes |
| Wording/navigation | ✓ (Contractors tab) | — | No |
