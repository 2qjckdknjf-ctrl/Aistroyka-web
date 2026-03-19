# Step 13A — Project-Level Contractor Surface

## 1. What was added

- **Contractors tab** on the project detail page (dashboard/projects/[id]). Placed after the “Workers” tab.
- **Contractors panel** that:
  - Fetches project members with role = contractor via GET /api/v1/projects/:id/workers?role=contractor&limit=10&offset=...
  - Renders a table: Contractor (user_id link to worker detail), Status, Created, Actions.
  - “View tasks” action links to /dashboard/tasks?worker_id={userId}&project_id={projectId} so the manager sees tasks for that contractor scoped to the project.
- **URL support:** ?tab=contractors opens the Contractors tab (state and useEffect synced with searchParams).
- **Empty state:** “No contractors on this project. Add members with role ‘contractor’ in project workers.”

## 2. Manager usefulness

- Manager can open a project and see **contractors** explicitly, separate from the generic workers list.
- From the Contractors tab, manager can: open a contractor’s worker profile (reports, tasks, overdue, pending review) or jump to that contractor’s tasks for this project.
- No dead end: every row has “Contractor” link (worker detail) and “View tasks” (task list filtered by assignee + project).

## 3. Remaining gaps

- No contractor-level summary cards on the project (e.g. “3 contractors, 2 with overdue tasks”). Could be added later using existing worker summary API per contractor.
- Contractors tab does not show per-contractor task/report counts; manager gets those on worker detail. Acceptable for closure.
- Role is not editable from this tab; role is set in project members (workers tab or elsewhere). No change to that flow in Step 13A.
