# Project Timeline / Activity Feed — MVP

Unified project activity feed. **No event bus, no audit platform.**

## What it is

A **read-time aggregated** chronological feed of key project events. Derived from existing domain tables. Not a full audit trail.

## Event types

| Event                       | Source           | Timestamp      |
|----------------------------|------------------|----------------|
| Issue created              | project_issues   | created_at     |
| Issue status changed      | project_issues   | updated_at (status=in_review) |
| Issue resolved             | project_issues   | resolved_at    |
| Report submitted           | worker_reports   | submitted_at   |
| Document submitted for review | project_documents | updated_at (under_review, no decided_by) |
| Document resubmitted for review | project_documents | updated_at (under_review, decided_by set) |
| Owner decision: approved   | project_documents | updated_at   |
| Owner decision: rejected  | project_documents | updated_at   |
| Owner decision: changes requested | project_documents | updated_at |
| Task assigned             | worker_tasks     | updated_at (assigned_to set, status pending/in_progress) |
| Task completed             | worker_tasks     | updated_at (status=done) |

## Data sources

- **project_issues** — created, status_changed (in_review), resolved
- **project_documents** — under_review (first vs resubmitted via decided_by), approved, rejected, changes_requested
- **worker_tasks** — assigned (assigned_to, pending/in_progress), completed (status=done)
- **worker_reports** — status=submitted (via worker_day.project_id or task_id)

## Timeline item model

- id, eventType, occurredAt, actorId?, actorLabel?, title, description?, projectId, entityType, entityId, targetUrl

## API

`GET /api/v1/projects/:id/timeline?limit=30`

Returns array of timeline items, sorted by occurredAt descending.

## vs Notifications

- **Notifications** = delivered records (who was told)
- **Timeline** = derived activity feed (what happened)

Timeline uses domain tables, not notification rows.

## MVP limitations

- No event sourcing
- No realtime
- No advanced filtering
- No full audit log
- Actor labels not resolved (actorId only when available)
- Document resubmitted inferred from under_review + decided_by (no history table)
