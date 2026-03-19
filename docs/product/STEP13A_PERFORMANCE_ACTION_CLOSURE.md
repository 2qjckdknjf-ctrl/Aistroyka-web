# Step 13A — Performance / Action Closure

## 1. What became more useful

- **Worker summary API** now returns **reports_pending_review**: count of reports with status `submitted` or `changes_requested` (awaiting manager action). Grounded in existing worker_reports data.
- **Worker detail page** shows “Reports pending review” in the summary block. Manager sees an explicit attention cue and can open “View all reports” to act.
- **Contractors tab** on project gives a dedicated contractor list with “View tasks” so manager can quickly reach contractor-scoped task list. No new KPI; navigation and visibility improved.

## 2. Grounded signals (no fake metrics)

| Signal | Source | Exposed |
|--------|--------|--------|
| reports_count | worker_reports count by user_id | Worker summary, worker detail |
| media_count | worker_report_media by report_id | Worker summary, worker detail |
| tasks_assigned | worker_tasks where assigned_to = user, status in (pending, in_progress) | Worker summary, worker detail |
| tasks_overdue | Same + due_date < today | Worker summary, worker detail |
| reports_pending_review | worker_reports where user_id = user, status in (submitted, changes_requested) | Worker summary, worker detail (new in 13A) |
| is_contractor | project_members with role = contractor | Worker summary, worker detail badge |

## 3. Still intentionally lightweight

- No contractor risk score, no composite KPI, no stored contractor_performance table.
- No integration with ops overview or notifications feed (e.g. “contractor X has overdue tasks” in a central list). Deferred; manager reaches contractor context via project Contractors tab and worker detail.
- Actionability: manager is directed to tasks and reports via links; no new “action queue” or “attention” API. Closure is visibility + navigation + one extra grounded count (reports_pending_review).
