# Telemetry

## Overview

Telemetry events are emitted for product and system behavior. Currently they are written to the structured log stream; later they can be sent to an analytics or metrics backend.

## Location

- **lib/telemetry/telemetry.types.ts**: `TelemetryEventType`, `TelemetryEvent`.
- **lib/telemetry/telemetry.service.ts**: `emitTelemetryEvent(type, options)`.

## Event types

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

Each call results in a `logStructured` event with `event: "telemetry"`, `telemetry_type`, `tenant_id`, `project_id`, `payload`, `at`. No PII in payload; use IDs only.

## Extension

To send to an external sink (e.g. analytics pipeline, data warehouse), add a subscriber or replace the implementation in `telemetry.service.ts` to push to that sink in addition to (or instead of) logging.
