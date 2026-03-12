/**
 * Telemetry event types for product and system events.
 */

export type TelemetryEventType =
  | "project_created"
  | "task_created"
  | "report_submitted"
  | "workflow_triggered"
  | "copilot_invoked"
  | "risk_detected";

export interface TelemetryEvent {
  type: TelemetryEventType;
  tenantId?: string | null;
  projectId?: string | null;
  payload?: Record<string, unknown>;
  at: string;
}
