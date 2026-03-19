# Step 13 — Contractor Summary

## What Contractor Capability Is Now Real

- **Contractor identity:** A contractor is a user with at least one `project_members` row with `role = 'contractor'`. No separate contractor table.
- **Manager task list:** Can filter tasks by assignee (assigned_to). API: GET /api/v1/tasks?assigned_to={userId}. Dashboard: “Worker” filter that sends assigned_to.
- **Manager report list:** Already supported worker_id filter; no change. Manager can focus on one worker’s/contractor’s reports.
- **Worker detail (manager):** Shows “Contractor” badge when user has contractor role; shows tasks assigned and tasks overdue; links to “Tasks assigned to this worker” and “View all reports.”
- **Worker summary API:** GET /api/v1/workers/:userId/summary returns reports_count, media_count, is_contractor, tasks_assigned, tasks_overdue.
- **Project workers API:** GET /api/v1/projects/:id/workers?role=contractor returns only members with role=contractor (and similarly role=worker, role=manager).
- **Docs:** Scope inventory, domain model, history model, performance model, access model, action integration, validation report, post-audit, and this summary.

## What Remains Partial and Why

- **Performance:** Only derived counts (tasks assigned, overdue, reports); no stored contractor_performance table or risk score. Kept minimal and explainable on purpose.
- **Action/intelligence:** Contractor context is integrated into existing manager surfaces only; no new action feed or intelligence API.
- **Task list assigned_to:** Filters by worker_tasks.assigned_to only; tasks assigned solely via task_assignments are not included in the filtered list (P1 improvement).

## Whether Next Major Step Is Allowed

**Yes.** Step 13 is closed enough. The product has a real contractor-specific operational layer: explicit contractor semantics, manager-facing contractor context and filters, role-aware views, and documented access and performance model. No blocking gaps.

## Exact Blockers If Not Allowed

N/A — next major step is allowed.
