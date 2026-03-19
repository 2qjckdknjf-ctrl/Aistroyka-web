# Step 13 — Contractor History / Context Model

## 1. Definition

Contractor history/context = the set of data that answers: “What has this contractor done? What are they responsible for? What is their current state?”

## 2. Data Sources (Repo Truth)

- **Projects:** `project_members` where `user_id = X` and `role = 'contractor'` and `status = 'active'`. Lists projects the user is a contractor on.
- **Tasks:** `worker_tasks` where `assigned_to = X` (and optionally tasks in `task_assignments` for user X). Status, due_date, project_id available.
- **Reports:** `worker_reports` where `user_id = X`. status, submitted_at, reviewed_at, task_id available.
- **Documents:** Project-scoped; no direct “contractor documents” table. Access via project membership.

## 3. What We Support

| Capability | Implementation |
|------------|----------------|
| Which projects a contractor has worked on | `project_members` where role = 'contractor'; project list by project_id. |
| Recent reports by contractor | GET /api/v1/reports?worker_id={userId}. Existing. |
| Recent / open tasks by contractor | GET /api/v1/tasks?assigned_to={userId}. New filter in Step 13. |
| Current open work | Tasks with status pending/in_progress; reports with status draft/submitted/changes_requested. |
| Overdue work | Tasks where assigned_to = user, due_date < today, status in (pending, in_progress). Derived in worker summary. |
| Pending approvals | Reports with status submitted (or changes_requested) awaiting manager review. Can be derived from worker_reports. |
| Manager-visible contractor summary | GET /api/v1/workers/:userId/summary returns reports_count, media_count, is_contractor, tasks_assigned, tasks_overdue. |

## 4. Not Implemented (Explicit Limits)

- No dedicated “contractor timeline” or “contractor activity feed” table.
- No “contractor document list” beyond project documents (manager sees project docs; contractor sees via project access).
- Overdue/pending counts are derived on read; not stored in a history table.

## 5. Usage

- **Manager:** Worker detail page shows contractor badge, tasks assigned, tasks overdue, and links to “Tasks assigned to this worker” and “View all reports.” Tasks list and reports list can be filtered by worker_id/assigned_to.
- **Contractor-facing:** Unchanged; contractor uses same worker flows (assigned tasks, own reports) with existing scoping.
