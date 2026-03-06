# Phase 7.6 — Tasks System Hardening

**Date:** 2026-03-06  
**Scope:** End-to-end task↔report linkage, manager tasks console, push triggers, ops compliance, E2E smoke.

---

## Goals

- **A)** Reports linked to tasks server-side (optional task_id); visible in cockpit/report details.
- **B)** Manager can create/update/assign tasks in web: `/dashboard/tasks` (+ `/[id]`).
- **C)** Worker sees tasks in iOS Today; starting report from task passes task_id to server.
- **D)** Assign/update triggers server-side push via outbox: task_assigned / task_updated.
- **E)** Ops metrics + overview show task compliance and deep-link into filtered views.
- **F)** E2E smoke: manager creates task → assigns → worker sees → submits report → manager sees linkage.

---

## Endpoints (additive / extended)

| Method | Path | Purpose |
|--------|------|--------|
| POST | /api/v1/worker/report/create | Extended: optional `task_id` (validated). |
| POST | /api/v1/worker/report/submit | Extended: optional `task_id` (if not set on create). |
| GET | /api/v1/worker/tasks/today | Extended: include `report_id`, `report_status` when linked. |
| POST | /api/v1/tasks | Create task (manager). |
| PATCH | /api/v1/tasks/:id | Update task (manager). |
| POST | /api/v1/tasks/:id/assign | Assign task to worker (manager). |
| GET | /api/v1/tasks | List tasks (filters: project_id, from, to, status, q). |
| GET | /api/v1/tasks/:id | Task detail + assignment + linked report(s). |
| GET | /api/v1/ops/metrics | Extended: tasks_assigned_today, tasks_completed_today, tasks_open_today. |
| GET | /api/v1/ops/overview | Extended: queues tasksOpenToday, tasksOverdue. |

---

## Routes (web)

| Path | Purpose |
|------|---------|
| /dashboard/tasks | Manager tasks list (filters, create, assign). |
| /dashboard/tasks/[id] | Task detail (edit, assign, link to report). |

---

## DB migrations

- **20260306130000_reports_task_id.sql**: `worker_reports.task_id` UUID NULL FK to `worker_tasks(id)`, indexes `(tenant_id, task_id)` and `(task_id)`.
- **20260306140000_worker_tasks_extend.sql**: `worker_tasks.description`, `required_photos` (jsonb), `report_required` (boolean); status constraint extended with `cancelled`.

---

## RBAC

- Worker: create/submit own report (with optional task_id if assigned); GET worker/tasks/today.
- Manager/Admin: POST/PATCH tasks, POST assign; GET tasks, GET tasks/:id.
- All writes: requireTenant(ctx); idempotency key required where specified.

---

## Push triggers

- On task assign: enqueue task_assigned (payload task_id, project_id) to assignee devices.
- On task update: enqueue task_updated (payload task_id, status if changed).
- Dedupe: per (task_id, user_id, platform, type) to avoid duplicate notifications.

---

## Cockpit changes

- Ops overview: queues tasksOpenToday, tasksOverdue; deep links to /dashboard/tasks?...
- Dashboard KPI cards: tasks assigned today, completed today, open tasks.

---

## Verification checklist

1. **Backend**: `cd apps/web && bun run test -- --run && bun run cf:build` — passes.
2. Manager creates task at /dashboard/tasks → assigns to worker → worker sees in iOS Today (GET /api/v1/worker/tasks/today).
3. Worker starts report from task → report/create with task_id (iOS passes draftTaskId in payload) → submit → report shows task link in list/detail.
4. Manager sees task detail with linked report; report detail shows task title (task_id / report_id in APIs).
5. Push: assign/update enqueues outbox via `enqueuePushToUser`; worker receives and can refresh list (Stage 6: iOS banner/refresh).
6. Ops metrics (GET /api/v1/ops/metrics) and overview (GET /api/v1/ops/overview) return tasks_* KPIs and tasksOpenToday/tasksOverdue queues; dashboard KPI cards link to /dashboard/tasks with filters.
7. E2E smoke: add Playwright spec (manager login → create task → assign → verify list; API-level worker report with task_id; manager sees link) — Stage 7.
8. iOS build: `cd ios/WorkerLite && xcodebuild -scheme WorkerLite -destination 'platform=iOS Simulator,name=iPhone 15' build`.

---

## Rollout notes

- Deploy backend first (migrations, new endpoints); then web UI; then iOS update.
- task_id on reports is optional; existing reports unchanged.
