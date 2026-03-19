# Step 11 — Approval Domain Model

**Target entity:** Worker report (`worker_reports`).

## Status model

| Status | Meaning | Who sets |
|--------|---------|----------|
| `draft` | Worker editing | Worker (create, no submit yet) |
| `submitted` | Awaiting manager decision | Worker (submit) or system (resubmit after changes_requested) |
| `approved` | Manager accepted | Manager (review) |
| `rejected` | Manager rejected | Manager (review) |
| `changes_requested` | Manager asked for changes; worker may resubmit | Manager (review) |

## Allowed transitions

- draft → **submitted** (worker submit)
- submitted → **approved** | **rejected** | **changes_requested** (manager review)
- changes_requested → **submitted** (worker resubmit)

No other transitions. Rejected and approved are terminal for the approval cycle (worker does not “un-reject”).

## Roles

| Action | Who |
|--------|-----|
| Submit report | Member+ (worker); owner of report (user_id) |
| Resubmit after changes_requested | Same worker |
| Approve / Reject / Request changes | Manager (canManageProjects: owner, admin) |

Visibility: tenant-scoped; manager sees all tenant reports; worker sees own.

## Optional reason/comment

- **manager_note**: Optional text set by manager; recommended when status = changes_requested. Stored on report row; shown in UI and in approval history.

## Linkage

- Report has `user_id` (submitter), `task_id` (optional), `day_id` (optional) → worker_day → project_id for context.
- Approval history: from audit_logs (report_submit, report_review) by resource_type=report, resource_id=report.id.

## Tenant boundary

All listing and mutation are tenant-scoped (tenant_id). No cross-tenant visibility or actions.
