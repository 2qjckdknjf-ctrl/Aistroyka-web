# Step 13 — Contractor Domain Model

## 1. Design Principle

- **No separate contractor entity table.** Contractor is a **role** attached to a user in the context of a project.
- **No procurement lifecycle.** We do not model contracts, SOWs, or vendor master data in this step.
- **Explicit semantics:** “Contractor” = user who has at least one `project_members` row with `role = 'contractor'` and `status = 'active'`.

---

## 2. Chosen Entities and Linkage

### 2.1 Existing Tables Used

| Table | Relevance |
|-------|-----------|
| `project_members` | (tenant_id, project_id, user_id, **role**, status). role = 'contractor' defines project-level contractor. |
| `tenant_members` | (tenant_id, user_id, role). role = 'viewer' maps to enterprise CONTRACTOR (read-only tenant scope). |
| `worker_tasks` | project_id, **assigned_to**; tasks assigned to a user (contractor or worker). |
| `task_assignments` | (tenant_id, task_id, **user_id**); multi-assignment; same user_id semantics. |
| `worker_reports` | user_id, task_id, status, reviewed_at, reviewed_by; reports by assignee. |
| `projects` | project_id links project_members and worker_tasks. |

### 2.2 Relationships

- **Project ↔ contractor:** A contractor is linked to a project by `project_members(project_id, user_id, role='contractor')`.
- **Worker ↔ contractor:** In this model, “worker” and “contractor” are **roles**, not separate entity types. The same user can be worker on one project and contractor on another. No worker↔contractor table; both are user_id.
- **Task ↔ contractor:** Task is “contractor’s task” if task.assigned_to = user_id or (task_id, user_id) in task_assignments, and that user is a contractor on the task’s project (or any project in tenant).
- **Report ↔ contractor:** Report is “contractor’s report” if worker_reports.user_id = user_id and that user is a contractor on at least one project.
- **Document:** Documents are project-scoped; no direct contractor↔document table. Access remains project/tenant-based.

### 2.3 Optional Contractor Status / Summary Fields

- **No new columns** on users or projects for this phase.
- **Derived only:** “Is contractor” = exists project_members where user_id = X and role = 'contractor' and status = 'active'. Contractor summary (tasks count, overdue count, report counts) = computed from worker_tasks, task_assignments, worker_reports.

---

## 3. What We Do Not Introduce

- No `contractors` table.
- No `contractor_contracts` or `contractor_performance` tables (referenced in legacy docs but not in repo migrations).
- No procurement or vendor lifecycle.
- No new status enum for “contractor” beyond project_members.role and tenant_members.role.

---

## 4. Remaining Gaps (Accepted for Step 13)

- **Contractor as first-class ID:** There is no stable “contractor_id” separate from user_id; APIs use user_id and derive “is contractor” from project_members.
- **Multi-organization contractor:** If a user is contractor on several projects, we do not aggregate them into one “contractor profile” entity; we show per-project membership and tenant-scoped task/report lists.
- **Performance storage:** No persisted contractor_performance table; performance is derived on read. Future migration could add a cache table if needed.
