/**
 * Audit and trace types for AI conclusions and workflow execution.
 */

export type AuditEntryAction =
  | "ai_brain_health_computed"
  | "ai_brain_risk_aggregated"
  | "copilot_brief_generated"
  | "workflow_trigger_fired"
  | "workflow_action_dispatched"
  | "platform_alert_created";

export interface AuditEntryParams {
  tenant_id: string;
  user_id?: string | null;
  trace_id?: string | null;
  action: AuditEntryAction | string;
  resource_type?: "project" | "report" | "task" | "alert" | "workflow";
  resource_id?: string | null;
  details?: Record<string, unknown>;
}

/** For explainability: AI conclusion / recommendation trace. */
export interface AiConclusionTraceParams {
  tenant_id: string;
  project_id: string;
  source: "ai_brain" | "copilot";
  use_case?: string;
  conclusion_type?: string;
  summary?: string;
  risks?: string[];
  recommendations?: string[];
  trace_id?: string | null;
}

/** Workflow execution trace for audit. */
export interface WorkflowTraceParams {
  tenant_id: string;
  project_id?: string | null;
  trigger_type: string;
  rule_id: string;
  conditions_passed: boolean;
  actions_executed: string[];
  error?: string | null;
  trace_id?: string | null;
}
