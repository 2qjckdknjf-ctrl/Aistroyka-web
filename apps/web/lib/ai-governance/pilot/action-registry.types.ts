/**
 * Governed AI pilot action registry types.
 * Central policy layer for safe pilot automations.
 */

export type AiRiskClass =
  | "READ_ONLY"
  | "DRAFT_ONLY"
  | "LOW_RISK_AUTOMATION"
  | "CONSEQUENTIAL_REQUIRES_APPROVAL"
  | "PROHIBITED";

export type AiExternalVisibility = "internal" | "owner_draft" | "owner_approved_only" | "none";

export type PilotAiActionId =
  | "remind_missing_daily_report"
  | "validate_report_required_fields"
  | "validate_before_after_photos"
  | "draft_daily_summary"
  | "draft_weekly_summary"
  | "suggest_issue_category"
  | "suggest_responsible_manager"
  | "draft_owner_message"
  | "draft_followup_open_issue";

export interface PilotAiActionDefinition {
  actionId: PilotAiActionId;
  title: string;
  description: string;
  riskClass: AiRiskClass;
  requiredTenantRole: Array<"owner" | "admin" | "manager" | "member" | "worker" | "stakeholder">;
  allowedProjectRoles: Array<"owner" | "manager" | "worker" | "stakeholder" | "viewer">;
  requiresHumanApproval: boolean;
  supportsDryRun: boolean;
  externalVisibility: AiExternalVisibility;
  featureFlag: string;
  retentionPolicy: "standard_audit_90d" | "extended_audit_365d";
  inputSchemaRef: string;
  outputSchemaRef: string;
}

export type AiActionExecutionStatus =
  | "blocked"
  | "dry_run"
  | "draft_ready"
  | "pending_approval"
  | "executed"
  | "error";

export interface AiActionExecutionRequest {
  actionId: PilotAiActionId | string;
  tenantId: string;
  projectId: string;
  initiatedBy: string;
  userRole: string;
  projectRole?: string | null;
  idempotencyKey?: string | null;
  dryRun?: boolean;
  input?: Record<string, unknown>;
  sourceRefs?: Array<{ type: string; id: string }>;
}

export interface AiActionExecutionResult {
  status: AiActionExecutionStatus;
  actionId: string;
  policyVersion: string;
  riskClass: AiRiskClass;
  requiresHumanApproval: boolean;
  draft?: Record<string, unknown>;
  warnings: string[];
  errorCategory?: string;
  auditRecordId?: string;
}
