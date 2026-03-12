/**
 * Audit extension for AI and workflow actions.
 * Use with existing observability/audit.service (emitAudit) when persisting.
 */

export type AuditActionAI =
  | "ai_brain_health_computed"
  | "ai_brain_risk_aggregated"
  | "copilot_brief_generated"
  | "workflow_trigger_fired"
  | "workflow_action_dispatched"
  | "alert_created";

export interface AuditAIParams {
  tenant_id: string;
  user_id?: string | null;
  action: AuditActionAI;
  resource_type?: "project" | "report" | "task" | "alert";
  resource_id?: string | null;
  details?: {
    projectId?: string;
    useCase?: string;
    triggerType?: string;
    actionType?: string;
    source?: string;
  };
}
