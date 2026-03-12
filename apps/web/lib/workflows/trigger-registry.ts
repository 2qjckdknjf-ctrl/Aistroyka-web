/**
 * Registry of supported trigger types and their payload shapes.
 */

import type { TriggerType } from "./workflow.types";

export const TRIGGER_PAYLOAD_KEYS: Record<TriggerType, string[]> = {
  report_submitted: ["reportId", "projectId", "tenantId", "userId"],
  report_missing: ["projectId", "tenantId", "dayId", "userId"],
  task_overdue: ["taskId", "projectId", "tenantId", "dueDate", "overdueDays"],
  risk_detected: ["projectId", "tenantId", "severity", "source", "title"],
  missing_evidence_detected: ["projectId", "tenantId", "taskId", "required", "actual"],
  project_health_degraded: ["projectId", "tenantId", "score", "label", "blockers"],
};

export function isTriggerType(s: string): s is TriggerType {
  return Object.keys(TRIGGER_PAYLOAD_KEYS).includes(s);
}

export function validateTriggerPayload(
  type: TriggerType,
  payload: Record<string, unknown>
): boolean {
  const keys = TRIGGER_PAYLOAD_KEYS[type];
  return keys.every((k) => payload[k] !== undefined && payload[k] !== null);
}
