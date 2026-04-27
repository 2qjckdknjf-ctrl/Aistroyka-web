/**
 * Canonical entitlement capability flags.
 * Single source of truth for feature flags derived from plan + add-ons.
 */

import type { EntitlementLimits } from "@aistroyka/contracts";

export interface EntitlementCapabilities {
  projects: boolean;
  phasesMilestones: boolean;
  tasks: boolean;
  dailyReports: boolean;
  photoEvidence: boolean;
  commentsMentions: boolean;
  notifications: boolean;
  inspections: boolean;
  defectsIssues: boolean;
  recheckFlow: boolean;
  qualityChecklistTemplates: boolean;
  issueDeadlinesSla: boolean;
  approvals: boolean;
  advancedApprovals: boolean;
  decisionLog: boolean;
  documents: boolean;
  advancedDocuments: boolean;
  actsFormalRecords: boolean;
  roleHierarchy: boolean;
  customRoles: boolean;
  approvalChains: boolean;
  basicDashboard: boolean;
  projectHealthSignals: boolean;
  riskSignals: boolean;
  managerAi: boolean;
  summaryGeneration: boolean;
  advancedAnalytics: boolean;
  portfolioAnalytics: boolean;
  multipleWorkspaces: boolean;
  sso: boolean;
  auditLogs: boolean;
  integrations: boolean;
  apiAccess: boolean;
  sla: boolean;
  assistedOnboarding: boolean;
  prioritySupport: boolean;
  whiteGlove: boolean;
}

export interface PlanEntitlement {
  limits: EntitlementLimits;
  capabilities: EntitlementCapabilities;
}
