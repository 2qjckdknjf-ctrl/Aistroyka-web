/**
 * Governed AI pilot action registry.
 * Stable action IDs with policy metadata for safe pilot automations.
 */

import type { AiRiskClass, PilotAiActionDefinition, PilotAiActionId } from "./action-registry.types";

export const AI_POLICY_VERSION = "pilot-v1";

const REGISTRY: Record<PilotAiActionId, PilotAiActionDefinition> = {
  remind_missing_daily_report: {
    actionId: "remind_missing_daily_report",
    title: "Remind missing daily report",
    description: "Notify worker when a required daily report was not submitted.",
    riskClass: "LOW_RISK_AUTOMATION",
    requiredTenantRole: ["owner", "admin", "manager"],
    allowedProjectRoles: ["manager"],
    requiresHumanApproval: false,
    supportsDryRun: true,
    externalVisibility: "none",
    featureFlag: "pilot_ai_remind_missing_report",
    retentionPolicy: "standard_audit_90d",
    inputSchemaRef: "PilotRemindMissingReportInput",
    outputSchemaRef: "PilotRemindMissingReportOutput",
  },
  validate_report_required_fields: {
    actionId: "validate_report_required_fields",
    title: "Validate report required fields",
    description: "Deterministic check of mandatory report fields before submit.",
    riskClass: "READ_ONLY",
    requiredTenantRole: ["owner", "admin", "manager", "member", "worker"],
    allowedProjectRoles: ["worker", "manager"],
    requiresHumanApproval: false,
    supportsDryRun: true,
    externalVisibility: "none",
    featureFlag: "pilot_ai_validate_report_fields",
    retentionPolicy: "standard_audit_90d",
    inputSchemaRef: "PilotValidateReportInput",
    outputSchemaRef: "ReportCompletenessResult",
  },
  validate_before_after_photos: {
    actionId: "validate_before_after_photos",
    title: "Validate before/after photos",
    description: "Check before/after photo pairing and coverage for a report.",
    riskClass: "READ_ONLY",
    requiredTenantRole: ["owner", "admin", "manager", "member", "worker"],
    allowedProjectRoles: ["worker", "manager"],
    requiresHumanApproval: false,
    supportsDryRun: true,
    externalVisibility: "none",
    featureFlag: "pilot_ai_validate_before_after",
    retentionPolicy: "standard_audit_90d",
    inputSchemaRef: "PilotValidateBeforeAfterInput",
    outputSchemaRef: "ReportCompletenessResult",
  },
  draft_daily_summary: {
    actionId: "draft_daily_summary",
    title: "Draft daily summary",
    description: "Prepare manager-facing daily progress draft from verified evidence.",
    riskClass: "DRAFT_ONLY",
    requiredTenantRole: ["owner", "admin", "manager"],
    allowedProjectRoles: ["manager"],
    requiresHumanApproval: true,
    supportsDryRun: true,
    externalVisibility: "internal",
    featureFlag: "pilot_ai_draft_daily_summary",
    retentionPolicy: "standard_audit_90d",
    inputSchemaRef: "PilotDraftSummaryInput",
    outputSchemaRef: "PilotDraftSummaryOutput",
  },
  draft_weekly_summary: {
    actionId: "draft_weekly_summary",
    title: "Draft weekly summary",
    description: "Prepare manager-facing weekly progress draft from verified evidence.",
    riskClass: "DRAFT_ONLY",
    requiredTenantRole: ["owner", "admin", "manager"],
    allowedProjectRoles: ["manager"],
    requiresHumanApproval: true,
    supportsDryRun: true,
    externalVisibility: "internal",
    featureFlag: "pilot_ai_draft_weekly_summary",
    retentionPolicy: "standard_audit_90d",
    inputSchemaRef: "PilotDraftSummaryInput",
    outputSchemaRef: "PilotDraftSummaryOutput",
  },
  suggest_issue_category: {
    actionId: "suggest_issue_category",
    title: "Suggest issue category",
    description: "Propose defect/issue category from evidence (draft only).",
    riskClass: "DRAFT_ONLY",
    requiredTenantRole: ["owner", "admin", "manager", "member", "worker"],
    allowedProjectRoles: ["worker", "manager"],
    requiresHumanApproval: true,
    supportsDryRun: true,
    externalVisibility: "internal",
    featureFlag: "pilot_ai_suggest_issue_category",
    retentionPolicy: "standard_audit_90d",
    inputSchemaRef: "PilotSuggestIssueInput",
    outputSchemaRef: "PilotSuggestIssueOutput",
  },
  suggest_responsible_manager: {
    actionId: "suggest_responsible_manager",
    title: "Suggest responsible manager",
    description: "Propose manager assignment for an open issue (draft only).",
    riskClass: "DRAFT_ONLY",
    requiredTenantRole: ["owner", "admin", "manager"],
    allowedProjectRoles: ["manager"],
    requiresHumanApproval: true,
    supportsDryRun: true,
    externalVisibility: "internal",
    featureFlag: "pilot_ai_suggest_manager",
    retentionPolicy: "standard_audit_90d",
    inputSchemaRef: "PilotSuggestManagerInput",
    outputSchemaRef: "PilotSuggestManagerOutput",
  },
  draft_owner_message: {
    actionId: "draft_owner_message",
    title: "Draft owner message",
    description: "Prepare customer-safe owner update draft; requires manager approval before send.",
    riskClass: "CONSEQUENTIAL_REQUIRES_APPROVAL",
    requiredTenantRole: ["owner", "admin", "manager"],
    allowedProjectRoles: ["manager"],
    requiresHumanApproval: true,
    supportsDryRun: true,
    externalVisibility: "owner_draft",
    featureFlag: "pilot_ai_draft_owner_message",
    retentionPolicy: "extended_audit_365d",
    inputSchemaRef: "PilotDraftOwnerMessageInput",
    outputSchemaRef: "PilotDraftOwnerMessageOutput",
  },
  draft_followup_open_issue: {
    actionId: "draft_followup_open_issue",
    title: "Draft follow-up for open issue",
    description: "Prepare internal follow-up draft for an open project issue.",
    riskClass: "DRAFT_ONLY",
    requiredTenantRole: ["owner", "admin", "manager"],
    allowedProjectRoles: ["manager"],
    requiresHumanApproval: true,
    supportsDryRun: true,
    externalVisibility: "internal",
    featureFlag: "pilot_ai_draft_issue_followup",
    retentionPolicy: "standard_audit_90d",
    inputSchemaRef: "PilotDraftIssueFollowupInput",
    outputSchemaRef: "PilotDraftIssueFollowupOutput",
  },
};

export const PILOT_AI_ACTION_IDS = Object.keys(REGISTRY) as PilotAiActionId[];

export function getPilotActionDefinition(actionId: string): PilotAiActionDefinition | null {
  return REGISTRY[actionId as PilotAiActionId] ?? null;
}

export function listPilotActions(): PilotAiActionDefinition[] {
  return Object.values(REGISTRY);
}

export function classifyPilotRiskClass(actionId: string): AiRiskClass {
  const def = getPilotActionDefinition(actionId);
  if (!def) return "PROHIBITED";
  return def.riskClass;
}

export function isPilotActionId(actionId: string): actionId is PilotAiActionId {
  return actionId in REGISTRY;
}
