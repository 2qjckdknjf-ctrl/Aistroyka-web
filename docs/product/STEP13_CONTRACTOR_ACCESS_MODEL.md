# Step 13 — Contractor Access Model

## 1. Who Can See What

| Actor | Contractor list (per project) | Contractor summary (worker detail) | Contractor-scoped tasks | Contractor-scoped reports |
|-------|--------------------------------|-------------------------------------|--------------------------|----------------------------|
| Manager / Owner | Yes (project members with role=contractor) | Yes (worker summary includes is_contractor, tasks, reports) | Yes (tasks filtered by assigned_to) | Yes (reports filtered by worker_id) |
| Contractor (self) | N/A (sees own assigned tasks and reports only) | Own summary only (if viewing self) | Own tasks only (worker API) | Own reports only |
| Worker | Same as tenant; no special “contractor” scope | Can open worker detail if allowed by tenant policy | Task list by assignment | Report list by tenant/project |

## 2. Existing Mechanisms

- **Tenant:** All contractor/worker data is tenant-scoped. Resolved via getTenantContextFromRequest; requireTenant enforces auth.
- **Project:** project_members defines who can access a project; role (worker | contractor | manager) is visible to managers. RLS and API checks use tenant_members and project_members.
- **Task/report visibility:** Manager list endpoints are tenant-scoped; assigned_to and worker_id filters do not expand visibility beyond what the tenant already allows.

## 3. Step 13 Additions

- **No new permission tables or roles.** Contractor remains a project-level role (project_members.role = 'contractor').
- **Manager-only filters:** assigned_to on tasks and worker_id on reports are available to callers who can list tasks/reports (managers). Worker/contractor list endpoints remain tenant-scoped; filtering by role=contractor is a convenience for managers.
- **Contractor-facing:** No change. Contractors use the same worker flows; they see only assigned tasks and own reports (enforced by existing listTasksForUser and report ownership checks).

## 4. Role Separation

- **CONTRACTOR (tenant-level):** Maps from tenant_members.role = 'viewer'. Read-only at tenant level (authz.types.ts). Project-level “contractor” is project_members.role = 'contractor'.
- **Manager views:** Can see contractor badge and contractor-scoped data for any user in the tenant who has contractor role on at least one project. No cross-tenant visibility.

## 5. Minimal New Permissions

None. All access uses existing “can list tasks,” “can list reports,” “can list project workers,” “can read worker summary” semantics. Contractor filter (role=contractor) and assigned_to filter are additive filters on existing authorized lists.
