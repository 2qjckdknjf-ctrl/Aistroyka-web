/**
 * Default workflow rule definitions (scaffold).
 * Host can replace with DB-backed or config-driven rules.
 */

import type { WorkflowRule, WorkflowTrigger, TriggerType } from "./workflow.types";

/** Example rules: high-risk → create_alert_record; overdue > 3 days → notify_manager. */
export const DEFAULT_WORKFLOW_RULES: WorkflowRule[] = [
  {
    id: "rule-risk-alert",
    trigger: "risk_detected",
    conditions: [{ kind: "severity_gte", severity: "high" }],
    actions: [{ type: "create_alert_record", params: { reason: "high_risk" } }],
    enabled: true,
  },
  {
    id: "rule-overdue-notify",
    trigger: "task_overdue",
    conditions: [{ kind: "overdue_days_gt", threshold: 3 }],
    actions: [{ type: "notify_manager", params: {} }],
    enabled: true,
  },
  {
    id: "rule-health-copilot",
    trigger: "project_health_degraded",
    conditions: [{ kind: "project_risk_score_gte", threshold: 40 }],
    actions: [{ type: "enqueue_copilot_summary", params: {} }],
    enabled: true,
  },
];

/** Returns default rules for a trigger type. In production, replace with getRulesForTrigger from DB. */
export async function getDefaultRulesForTrigger(
  trigger: WorkflowTrigger
): Promise<WorkflowRule[]> {
  return DEFAULT_WORKFLOW_RULES.filter(
    (r) => r.enabled && r.trigger === trigger.type
  );
}

export function getDefaultRulesByTriggerType(type: TriggerType): WorkflowRule[] {
  return DEFAULT_WORKFLOW_RULES.filter((r) => r.enabled && r.trigger === type);
}
