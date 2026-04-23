# Core Execution Workflow

**Purpose:** Canonical operational loop for field execution. Links project → milestone → task → report → photo → issue → decision.

**Scope:** Core product. Billing/checkout/monetization work is frozen.

---

## Canonical Entities

| Entity | Table | Key fields | Status enum |
|--------|-------|------------|-------------|
| Project | `projects` | id, name, tenant_id | (derived from activity) |
| Milestone | `project_milestones` | project_id, title, target_date | pending, in_progress, done, cancelled |
| Task | `worker_tasks` | project_id, milestone_id, assigned_to | pending, in_progress, done, cancelled |
| Report | `worker_reports` | task_id, user_id, day_id | draft, submitted, approved, rejected, changes_requested |
| Photo | `worker_report_media`, `media` | report_id, media_id | (linked) |
| Issue | `project_issues` | project_id, task_id?, milestone_id? | open, in_review, resolved, closed |
| Document (decision) | `project_documents` | project_id, task_id?, report_id? | draft, uploaded, under_review, approved, rejected, archived |

---

## Entity Relationships

```
project
  ├── project_milestones (1:n)
  ├── worker_tasks (1:n) ──► project_milestones (n:1)
  ├── worker_reports ──► worker_tasks (n:1, optional)
  ├── worker_report_media ──► worker_reports (n:1)
  ├── project_issues (1:n) ──► worker_tasks?, project_milestones? (optional)
  └── project_documents (1:n) ──► worker_tasks?, worker_reports?, project_milestones? (optional)
```

---

## Status Transitions

- **Task:** pending → in_progress → done | cancelled
- **Report:** draft → submitted → approved | rejected | changes_requested
- **Issue:** open → in_review → resolved → closed
- **Document:** draft → uploaded → under_review → approved | rejected

---

## API Surface

| Route | Purpose |
|-------|---------|
| GET/POST /api/v1/projects | List, create projects |
| GET /api/v1/projects/:id/summary | Task counts, milestones, issues, pending decisions |
| GET/POST /api/v1/projects/:id/milestones | List, create milestones |
| GET/POST /api/v1/projects/:id/issues | List, create issues |
| PATCH /api/v1/projects/:id/issues/:issueId | Update issue (status) |
| GET/POST /api/v1/tasks | List, create tasks (milestone_id optional) |
| POST /api/v1/tasks/:id/assign | Assign task |
| PATCH /api/v1/tasks/:id | Update task status |
| GET/POST /api/v1/worker/report/create | Create report (task_id optional) |
| PATCH /api/v1/reports/:id | Approve/reject report |

---

## Project Status Summary

The project summary aggregates:

- **tasksTotal,** **tasksInProgress,** **tasksDone** — from worker_tasks
- **milestonesCount** — from project_milestones
- **openIssuesCount** — from project_issues (status open or in_review)
- **pendingDecisionsCount** — from project_documents (status under_review)
- **openReports** — from worker_reports (draft/submitted)
- **aiAnalyses** — from analysis_jobs

---

## Golden Path

See `docs/product/CORE_WORKFLOW_GOLDEN_PATH.md`.

---

## What Was Implemented (This Step)

- project_issues table and API
- Project summary extended with task/milestone/issue/decision counts
- Issues tab and panel in project detail
- Milestone selector in task create form
- Create task link from Schedule with project+milestone pre-fill
- Documentation
