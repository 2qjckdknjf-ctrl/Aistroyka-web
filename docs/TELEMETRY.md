# Telemetry

## Overview

Telemetry events are emitted for product and system behavior. Currently they are written to the structured log stream; later they can be sent to an analytics or metrics backend. Core operational events are also persisted in `audit_logs` via `emitAudit`. Those rows are **BOTH** product telemetry and governance audit: actor/tenant come from the authenticated server context, details stay categorical (plus a UUID assignee only when it is a canonical user id), and a stalled or failed audit write does not roll back the product mutation.

Growth rates are not published from these events.

`GROWTH_BASELINE = WAITING_FOR_REAL_DATA`

## Location

- **lib/telemetry/telemetry.types.ts**: `TelemetryEventType`, `TelemetryEvent`.
- **lib/telemetry/telemetry.service.ts**: `emitTelemetryEvent(type, options)`.
- **lib/observability/audit.service.ts**: `emitAudit` into `audit_logs`.
- **lib/growth/product-events.ts**: categorical detail helpers and `boundedProductWrite`.

## Event types (log stream)

- `project_created`
- `task_created`
- `report_submitted`
- `workflow_triggered`
- `copilot_invoked`
- `risk_detected`

## `task_created` in `audit_logs`

A successful `POST /api/v1/tasks` that inserts a new `worker_tasks` row also writes one `audit_logs` row:

- `action`: `task_created`
- `resource_type`: `task`
- `resource_id`: the new task id
- `tenant_id` / `user_id`: the authenticated server context, not the request body

`task_created` means the task row was created. It is not assignment, view, start, or completion. An idempotent replay that returns the cached response does not write another row. Details are categorical only (`client`, `role`, `has_project`, `has_assignee`, `has_due_date`, `priority`, `source`). No title, description, or name is stored. A failed audit insert does not fail task creation. No task-creation rate is published.

## `task_assignment` in `audit_logs`

Classification: **BOTH** (product telemetry + governance audit).

A successful `POST /api/v1/tasks/:id/assign` that persists assignment (`task_assignments` replace + `worker_tasks.assigned_to`) writes one `audit_logs` row:

- `action`: `task_assignment`
- `resource_type`: `task`
- `resource_id`: the task id from the path
- `tenant_id` / `user_id`: authenticated manager context

It means assignment was successfully changed/persisted. It is not task create, form open, task view, notification send, or a failed assign attempt.

`PATCH /api/v1/tasks/:id` does not mutate `assigned_to`. Task create does not set an assignee. Mobile Manager uses the same assign route (one server event).

Details:

- CATEGORICAL: `source` (`task_assign`), `client`, `role`, `has_assignee`, `assignment_changed`
- IDENTIFIER (governance): `assigned_to` only when the assignee is a UUID. Names and emails are dropped.

Repeat events are allowed: reassignment history (task A → worker 1, then worker 2) is one row per successful persist. No unique index on task id. An `x-idempotency-key` replay that returns the cached response does not write another row. A `worker_tasks` update that matches zero rows is treated as failed persist and does not emit. Production assignment rate is not published.

## `report_submit` in `audit_logs`

Classification: **BOTH**.

`submitReport` (canonical HTTP: `POST /api/v1/worker/report/submit`; web and Worker apps share this server path) writes one `audit_logs` row only after a real transition:

- draft → submitted, or
- changes_requested → submitted (resubmit)

- `action`: `report_submit`
- `resource_type`: `report`
- `resource_id`: report id
- actor/tenant: authenticated submitter

It is not draft save, view, photo upload, start, or a failed submit. An already-submitted call returns an error and writes zero events. A status-guarded update that matches zero rows returns failure and writes zero events. Worker note, filenames, and URLs are not stored.

Details (CATEGORICAL): `source` (`report_submit`), `client`, `role`, `has_task`, `has_day`, `has_media`.

Repeat events are allowed only for a later legitimate resubmit after `changes_requested`. No one-row-per-report unique index. Production submit rate is not published.

## `report_review` in `audit_logs`

Classification: **BOTH**.

A successful `PATCH /api/v1/reports/:id` that moves a report from `submitted` to one of `approved` | `rejected` | `changes_requested` writes one `audit_logs` row:

- `action`: `report_review`
- `resource_type`: `report`
- `resource_id`: report id
- actor/tenant: authenticated reviewer

Canonical review statuses are those three values only. There is no `reviewed` status. Invalid transitions, forbidden reviewers, and updates that match no submitted row write zero events. Repeat identical review of an already-reviewed report cannot mutate (still `submitted`-only) and therefore does not emit. A later legitimate cycle (resubmit → review again) is a new history row. No one-row-per-report unique index.

Details (CATEGORICAL): `source` (`report_review`), `client`, `role`, `status`, `has_note`. The manager note is not stored in telemetry. Application notification copy may still include a truncated note for the worker; that is not `audit_logs.details`.

Production review turnaround is not published.

## Indexes

No new `audit_logs` indexes for these three actions. `task_created` uniqueness remains a one-time fact. Assignment, submit (including resubmit), and review are repeatable state-transition history.

## Usage

```ts
import { emitTelemetryEvent } from "@/lib/telemetry";

emitTelemetryEvent("report_submitted", {
  tenantId: "...",
  projectId: "...",
  payload: { reportId: "...", taskId: "..." },
});
```

## Output

Each log-stream call results in a `logStructured` event with `event: "telemetry"`, `telemetry_type`, `tenant_id`, `project_id`, `payload`, `at`. No PII in payload; use IDs only.

## Extension

To send to an external sink (e.g. analytics pipeline, data warehouse), add a subscriber or replace the implementation in `telemetry.service.ts` to push to that sink in addition to (or instead of) logging.
