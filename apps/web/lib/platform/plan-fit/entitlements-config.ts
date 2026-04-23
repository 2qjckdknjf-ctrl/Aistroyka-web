/**
 * Canonical plan default entitlements.
 * Single source of truth for limits and capability flags per plan.
 */

import type { PlanCode } from "@aistroyka/contracts";
import type { PlanEntitlement, EntitlementCapabilities } from "./entitlements.types";

function defaultCaps(): EntitlementCapabilities {
  return {
    projects: false,
    phasesMilestones: false,
    tasks: false,
    dailyReports: false,
    photoEvidence: false,
    commentsMentions: false,
    notifications: false,
    inspections: false,
    defectsIssues: false,
    recheckFlow: false,
    qualityChecklistTemplates: false,
    issueDeadlinesSla: false,
    approvals: false,
    advancedApprovals: false,
    decisionLog: false,
    documents: false,
    advancedDocuments: false,
    actsFormalRecords: false,
    roleHierarchy: false,
    customRoles: false,
    approvalChains: false,
    basicDashboard: false,
    projectHealthSignals: false,
    riskSignals: false,
    managerAi: false,
    summaryGeneration: false,
    advancedAnalytics: false,
    portfolioAnalytics: false,
    multipleWorkspaces: false,
    sso: false,
    auditLogs: false,
    integrations: false,
    apiAccess: false,
    sla: false,
    assistedOnboarding: false,
    prioritySupport: false,
    whiteGlove: false,
  };
}

export const PLAN_ENTITLEMENTS_DEFAULTS: Record<PlanCode, PlanEntitlement> = {
  client_personal: {
    limits: {
      maxUsers: 2,
      maxProjects: 2,
      maxStorageGb: 10,
      maxActiveMobileWorkers: 0,
      maxMonthlyAiRequests: 100,
    },
    capabilities: (() => {
      const c = defaultCaps();
      c.projects = true;
      c.phasesMilestones = true;
      c.photoEvidence = true;
      c.commentsMentions = true;
      c.notifications = true;
      c.decisionLog = true;
      c.basicDashboard = true;
      c.summaryGeneration = true;
      c.approvals = true;
      c.advancedApprovals = false;
      c.documents = true;
      c.advancedDocuments = false;
      c.inspections = true; // basic only
      c.defectsIssues = true; // basic only
      c.tasks = false; // client persona: no full contractor execution flow (documented)
      return c;
    })(),
  },

  team_contractor: {
    limits: {
      maxUsers: 20,
      maxProjects: 15,
      maxStorageGb: 100,
      maxActiveMobileWorkers: 20,
      maxMonthlyAiRequests: 2000,
    },
    capabilities: (() => {
      const c = defaultCaps();
      c.projects = true;
      c.phasesMilestones = true;
      c.tasks = true;
      c.dailyReports = true;
      c.photoEvidence = true;
      c.commentsMentions = true;
      c.notifications = true;
      c.defectsIssues = true;
      c.inspections = true; // basic
      c.approvals = true;
      c.advancedApprovals = false;
      c.documents = true;
      c.advancedDocuments = false;
      c.basicDashboard = true;
      c.summaryGeneration = true;
      c.managerAi = true; // basic/limited
      c.riskSignals = true; // limited/basic
      return c;
    })(),
  },

  business_operations: {
    limits: {
      maxUsers: 100,
      maxProjects: 100,
      maxStorageGb: 500,
      maxActiveMobileWorkers: 100,
      maxMonthlyAiRequests: 10000,
    },
    capabilities: (() => {
      const c = defaultCaps();
      c.projects = true;
      c.phasesMilestones = true;
      c.tasks = true;
      c.dailyReports = true;
      c.photoEvidence = true;
      c.commentsMentions = true;
      c.notifications = true;
      c.defectsIssues = true;
      c.inspections = true;
      c.recheckFlow = true;
      c.approvals = true;
      c.advancedApprovals = true;
      c.advancedDocuments = true;
      c.documents = true;
      c.decisionLog = true;
      c.roleHierarchy = true;
      c.customRoles = true;
      c.approvalChains = true;
      c.basicDashboard = true;
      c.projectHealthSignals = true;
      c.riskSignals = true;
      c.managerAi = true;
      c.summaryGeneration = true;
      c.advancedAnalytics = true;
      c.portfolioAnalytics = true;
      c.assistedOnboarding = true;
      c.integrations = true; // selected/phased rollout
      c.apiAccess = true; // controlled rollout
      c.sso = false;
      c.sla = false;
      c.whiteGlove = false;
      return c;
    })(),
  },

  enterprise: {
    limits: {
      maxUsers: 5000,
      maxProjects: 500,
      maxStorageGb: 2000,
      maxActiveMobileWorkers: 500,
      maxMonthlyAiRequests: 100000,
    },
    capabilities: (() => {
      const c = defaultCaps();
      c.projects = true;
      c.phasesMilestones = true;
      c.tasks = true;
      c.dailyReports = true;
      c.photoEvidence = true;
      c.commentsMentions = true;
      c.notifications = true;
      c.defectsIssues = true;
      c.inspections = true;
      c.recheckFlow = true;
      c.approvals = true;
      c.advancedApprovals = true;
      c.advancedDocuments = true;
      c.documents = true;
      c.decisionLog = true;
      c.roleHierarchy = true;
      c.customRoles = true;
      c.approvalChains = true;
      c.basicDashboard = true;
      c.projectHealthSignals = true;
      c.riskSignals = true;
      c.managerAi = true;
      c.summaryGeneration = true;
      c.advancedAnalytics = true;
      c.portfolioAnalytics = true;
      c.assistedOnboarding = true;
      c.integrations = true;
      c.apiAccess = true;
      c.sso = true;
      c.auditLogs = true;
      c.sla = true;
      c.prioritySupport = true;
      c.whiteGlove = true;
      c.multipleWorkspaces = true;
      return c;
    })(),
  },
};
