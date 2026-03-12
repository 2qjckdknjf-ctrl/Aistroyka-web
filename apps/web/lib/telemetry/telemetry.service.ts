/**
 * Telemetry layer: emit events for observability. Writes to logs; can be extended to external sinks.
 */

import { logStructured } from "@/lib/observability";
import type { TelemetryEvent, TelemetryEventType } from "./telemetry.types";

export function emitTelemetryEvent(
  type: TelemetryEventType,
  options: { tenantId?: string | null; projectId?: string | null; payload?: Record<string, unknown> } = {}
): void {
  const event: TelemetryEvent = {
    type,
    tenantId: options.tenantId ?? undefined,
    projectId: options.projectId ?? undefined,
    payload: options.payload,
    at: new Date().toISOString(),
  };
  logStructured({
    event: "telemetry",
    telemetry_type: type,
    tenant_id: event.tenantId ?? undefined,
    project_id: event.projectId ?? undefined,
    payload: event.payload,
    at: event.at,
  });
}
