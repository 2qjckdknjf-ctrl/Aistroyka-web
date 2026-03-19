# Step 13 — Contractor Scope Inventory

## 1. Current Repo Truth

### 1.1 Contractor Entity / Model

- **No dedicated `contractors` table** in this repo’s migrations. Docs (e.g. TECHNICAL_DOSSIER, ENTERPRISE_IMPLEMENTATION) reference tables `contractors`, `contractor_contracts`, `contractor_performance` from a legacy migration (20250228210000) that is **not** present in `apps/web/supabase/migrations/` (all migrations here start with 202603…).
- **Contractor as role:** Contractor is represented as a **role**, not a separate entity:
  - **Project-level:** `project_members.role` ∈ `('worker' | 'contractor' | 'manager')`. A user with `role = 'contractor'` on a project is a contractor for that project.
  - **Tenant-level:** `tenant_members.role` maps to enterprise roles; `viewer` → CONTRACTOR in `authz.types.ts`. Tenant-level CONTRACTOR is read-only.
- **Conclusion:** Contractor = **user** who has at least one `project_members` row with `role = 'contractor'` (and optionally tenant role viewer/CONTRACTOR). No separate contractor table required for this phase.

### 1.2 Worker / Project / Task Linkage

- **Workers:** Identified by `user_id`. Access to projects via `project_members` (tenant_id, project_id, user_id, role, status).
- **Tasks:** `worker_tasks` (tenant_id, project_id, assigned_to, …). Assignment also in `task_assignments` (tenant_id, task_id, user_id).
- **Reports:** `worker_reports` (tenant_id, user_id, task_id, status, reviewed_at, reviewed_by, …). Linked to tasks and thus to projects.
- **Conclusion:** Contractor linkage is **derived**: users with `project_members.role = 'contractor'`; their tasks = tasks where `assigned_to = user_id` or task in `task_assignments` for that user; their reports = `worker_reports.user_id = user_id`. No new FK tables needed.

### 1.3 Reports / Tasks / Documents and Contractor Ownership

- Tasks and reports are attributed by **user_id** (assigned_to, user_id). Documents are project-scoped; ownership is not per-contractor in the schema.
- **Conclusion:** Contractor “ownership” of tasks/reports = same as worker ownership (user_id). Contractor-specific views = filter by user_id where that user is a contractor (from project_members).

### 1.4 Contractor-Specific Permissions / Views

- **Existing:** Project-scoped RLS; `listProjectWorkers` returns `user_id, role, status` — so role is already available. Manager task list has `project_id` filter but **no assigned_to (user/contractor) filter**. Report list has `worker_id` (user_id) filter.
- **Gap:** No API or UI that explicitly “list contractors” or “tasks/reports for this contractor” with contractor semantics. Worker detail page exists (`/dashboard/workers/[userId]`) but does not show “contractor” badge or contractor-scoped entry points.

### 1.5 Contractor Performance History

- No `contractor_performance` table in repo. Performance can be **derived** from existing data: report count, report status (submitted / approved / changes_requested), task completion, overdue tasks (due_date & status).
- **Conclusion:** Implement performance as **derived signals** from worker_reports and worker_tasks (and task_assignments), not a new table. Document as partial/heuristic where data is thin.

### 1.6 Manager-Facing Contractor Context Today

- Manager can: list projects; list project workers (with role); list tasks (by project); list reports (by project, by worker_id); open worker detail (reports count, media count).
- **Missing:** Explicit “contractors” list per project or tenant; task list filter by assigned contractor; worker detail showing “Contractor” role and contractor-focused summary (e.g. tasks assigned, overdue); any contractor-level performance summary.

### 1.7 What Must Be Deferred

- **Budget / cost module** (per Step 13 rules).
- **Dedicated `contractors` / `contractor_contracts` / `contractor_performance` tables** unless we later add them in a separate migration (not required for minimal scope).
- **CAD / AutoCAD / market pricing / ERP-style procurement.**
- **Contractor-facing “portal” redesign** — contractor-facing flow remains “worker” flow (assigned tasks, own reports) with existing scoping.

---

## 2. Chosen Scope for This Phase

**Smallest high-value contractor scope:**

1. **Contractor identity:** Treat contractor as **user with project_members.role = 'contractor'** on at least one project. No new entity table.
2. **Contractor history/context:** For a given user (contractor): list projects where they are contractor; list their tasks (assigned_to or task_assignments); list their reports. Reuse existing APIs with filters; add **assigned_to** filter to manager task list API.
3. **Contractor-specific task/report UX:** Manager can filter tasks by **assigned_to** (user_id); reports already filter by worker_id. Add contractor filter to Tasks UI; optionally show “Contractors” subset in project workers or worker list.
4. **Contractor performance tracking:** Derived only: from existing worker_reports and worker_tasks (e.g. report status distribution, tasks completed, overdue count). Document in performance model; optionally extend worker summary API with tasks_assigned / tasks_overdue.
5. **Role-specific views/permissions:** Document that managers see contractor data via tenant/project membership; contractors see only assigned work (unchanged). No new permission tables; optional “contractor only” filter in project workers API/UI.
6. **Manager-facing surfaces:** Contractor-scoped task list (filter by assigned_to); project workers list with role visible and optional “Contractors only” filter; worker detail page shows “Contractor” when user has contractor role and links to contractor-relevant tasks/reports.

---

## 3. Deferred Scope and Why

| Item | Reason |
|------|--------|
| Dedicated `contractors` table | Current design uses project_members.role; sufficient for role-based contractor scope. |
| `contractor_contracts` / procurement lifecycle | Out of scope; no fake procurement. |
| Budget/cost per contractor | Budget module deferred to later step. |
| Contractor risk score / AI metrics | Can build on derived performance later; not required for “operational layer” closure. |
| Separate contractor app or portal | Contractor flow = existing worker flow; scoping already project/assignment-based. |
| Full analytics dashboard per contractor | Out of scope; summary + list views sufficient for “contractor-specific operational layer.” |

---

## 4. Summary

- **Evaluated:** Contractor exists as role (project_members.role = 'contractor'); no contractor table in repo; task/report attribution by user_id; manager has project/worker/task/report lists but no contractor-dedicated filters or summary.
- **Chosen scope:** Contractor = user with contractor role; contractor history/context = projects + tasks + reports for that user; add assigned_to filter to tasks API/UI; derived performance from reports/tasks; manager contractor views and optional contractor-only filter; document access and action integration.
- **Deferred:** New contractor tables, budget, CAD, ERP, full analytics, separate contractor portal.
