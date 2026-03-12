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
