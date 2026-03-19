# Step 13 — Contractor Performance Model

## 1. Principle

No fake KPIs. Signals are derived from existing data (worker_reports, worker_tasks, task_assignments). Where data is thin, we document it and keep explainability visible.

## 2. Data Available

- **Reports:** user_id, status (draft, submitted, approved, reviewed, changes_requested), submitted_at, reviewed_at, task_id.
- **Tasks:** assigned_to, status (pending, in_progress, done, cancelled), due_date, project_id.
- **Task assignments:** task_id, user_id (multi-assign).

## 3. Implemented Signals (Step 13)

| Signal | Source | Scope | Notes |
|--------|--------|--------|--------|
| Reports count | worker_reports where user_id = X | Worker summary API | Raw count. |
| Tasks assigned (open) | worker_tasks where assigned_to = X, status in (pending, in_progress) | Worker summary API | Count of current open tasks. |
| Tasks overdue | worker_tasks where assigned_to = X, due_date < today, status in (pending, in_progress) | Worker summary API | Simple overdue count. |

## 4. Possible Future Signals (Not Implemented)

- Report timeliness: time from task assignment to report submission (needs clear “assigned at” semantics).
- Task completion rate: completed vs assigned over a window (needs aggregation).
- Approval/rework rate: share of reports approved vs changes_requested (derivable from worker_reports.status).
- Activity density: reports per week/month (derivable from worker_reports.created_at).

These are documented in docs/ai/PREDICTIVE_ANALYTICS.md (contractor risk scoring). Not required for Step 13 “operational layer.”

## 5. Distinction: Explicit vs Inferred

- **Explicit:** Counts returned by API (reports_count, tasks_assigned, tasks_overdue) are exact query results.
- **Inferred:** “Performance” or “risk” is not computed; no single score or grade. Manager can form a picture from counts and links to tasks/reports.

## 6. Storage

No `contractor_performance` table. All signals are computed on read in the worker summary endpoint (and optionally in future dashboard widgets).
