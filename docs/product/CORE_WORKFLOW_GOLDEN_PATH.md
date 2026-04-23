# Core Workflow — Golden Path

**Purpose:** Canonical operational loop for construction/field execution. One clear path from project creation to status visibility.

**Scope:** Core product execution workflow. Billing/checkout/monetization work is frozen.

---

## Golden Path v1

1. **Create project** — Manager creates project (name).
2. **Add milestone** — Manager adds milestone (title, target date) in Schedule tab.
3. **Create task** — Manager creates task for project (optionally for milestone).
4. **Assign task** — Manager assigns task to worker/contractor.
5. **Worker creates report** — Worker creates report, optionally links to task.
6. **Worker attaches photos** — Photos attached via worker_report_media.
7. **Manager sees progress** — Project summary shows tasks, reports, open issues.
8. **Create issue (if problem)** — Manager or worker creates issue (defect/observation).
9. **Close issue** — Issue status changed to resolved/closed.
10. **Pending decisions** — Documents under_review surface as pending approvals.
11. **Dashboard reflects status** — Project summary: task counts, issues, pending decisions.

---

## Canonical Entities

| Entity | Table | Status enum |
|--------|-------|-------------|
| Project | `projects` | (no status; derived from activity) |
| Milestone | `project_milestones` | `pending`, `in_progress`, `done`, `cancelled` |
| Task | `worker_tasks` | `pending`, `in_progress`, `done`, `cancelled` |
| Report | `worker_reports` | `draft`, `submitted`, `approved`, `rejected`, `changes_requested` |
| Photo/media | `worker_report_media`, `media`, `upload_sessions` | (linked to report/task) |
| Issue | `project_issues` | `open`, `in_review`, `resolved`, `closed` |
| Decision/approval | `project_documents` (status `under_review`) | `draft`, `uploaded`, `under_review`, `approved`, `rejected`, `archived` |

---

## Links Between Entities

- **Task** → `project_id`, `milestone_id`, `assigned_to`
- **Report** → `task_id` (optional)
- **Photo** → `report_id` (worker_report_media), or `project_documents.task_id`/`report_id`
- **Issue** → `project_id`, `task_id` (optional), `milestone_id` (optional)
- **Document** → `project_id`, `task_id`, `report_id`, `milestone_id` (optional)

---

## Who Does What

| Role | Creates | Updates |
|------|---------|---------|
| Manager | project, milestone, task, issue | task status, assign, report approval, document approval, issue status |
| Worker/contractor | report (with task link), photos | report (draft) |
| System | — | — |

---

## Workflow Transitions

- **Task:** pending → in_progress (worker starts) → done (manager or worker marks)
- **Report:** draft → submitted → approved | rejected | changes_requested
- **Issue:** open → in_review → resolved → closed
- **Document:** draft → uploaded → under_review → approved | rejected

---

## What Was Implemented (This Step)

- Project summary extended with: task counts (total, in_progress, done), milestones count, open issues count, pending documents count
- `project_issues` table and API for defects/observations
- Issue create/list/status flow in project detail
- Milestone selector in task creation form
- Create task from project Schedule with project+milestone pre-filled
- Pending documents (under_review) surfaced as "Pending decisions" in summary
- Documentation: this file + CORE_EXECUTION_WORKFLOW.md

---

## Deferred

- Project-level status field (draft/active/paused/completed)
- Dedicated decision/approval entity (using project_documents for now)
- Owner/client-specific view
- Giant BI dashboard
