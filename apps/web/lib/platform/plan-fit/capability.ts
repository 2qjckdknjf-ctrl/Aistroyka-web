/**
 * Single capability layer. All plan/entitlement checks go through these helpers.
 */

import type { PlanCode } from "@aistroyka/contracts";
import { getPlanEntitlements } from "./plans";
import { PLAN_ENTITLEMENTS_DEFAULTS } from "./entitlements-config";
import type { CapabilityInput, UsageSnapshot } from "./capability.types";
import type { PlanEntitlement } from "./entitlements.types";

function getEntitlements(input: CapabilityInput): PlanEntitlement {
  return input.entitlements ?? getPlanEntitlements(input.planCode);
}

export function getWorkspaceCapabilities(input: CapabilityInput): {
  limits: PlanEntitlement["limits"];
  capabilities: PlanEntitlement["capabilities"];
} {
  const ent = getEntitlements(input);
  return { limits: ent.limits, capabilities: ent.capabilities };
}

export function canCreateProject(input: CapabilityInput): boolean {
  const ent = getEntitlements(input);
  if (!ent.capabilities.projects) return false;
  if (input.usage == null) return true;
  return input.usage.activeProjectsCount < ent.limits.maxProjects;
}

export function canInviteUser(input: CapabilityInput): boolean {
  const ent = getEntitlements(input);
  if (input.usage == null) return true;
  return input.usage.activeUsersCount < ent.limits.maxUsers;
}

export function canUseMobileWorkerFlow(input: CapabilityInput): boolean {
  const ent = getEntitlements(input);
  if (ent.limits.maxActiveMobileWorkers === 0) return false;
  if (input.usage == null) return true;
  return input.usage.activeUsersCount < ent.limits.maxActiveMobileWorkers;
}

export function canUseApprovals(input: CapabilityInput): boolean {
  return getEntitlements(input).capabilities.approvals;
}

export function canUseAdvancedApprovals(input: CapabilityInput): boolean {
  return getEntitlements(input).capabilities.advancedApprovals;
}

export function canUseDocuments(input: CapabilityInput): boolean {
  return getEntitlements(input).capabilities.documents;
}

export function canUseAdvancedDocuments(input: CapabilityInput): boolean {
  return getEntitlements(input).capabilities.advancedDocuments;
}

export function canUseInspections(input: CapabilityInput): boolean {
  return getEntitlements(input).capabilities.inspections;
}

export function canUsePortfolioAnalytics(input: CapabilityInput): boolean {
  return getEntitlements(input).capabilities.portfolioAnalytics;
}

export function canUseManagerAI(input: CapabilityInput): boolean {
  return getEntitlements(input).capabilities.managerAi;
}

export function canUseIntegrations(input: CapabilityInput): boolean {
  return getEntitlements(input).capabilities.integrations;
}

export function canUseSSO(input: CapabilityInput): boolean {
  return getEntitlements(input).capabilities.sso;
}

export function canUseApiAccess(input: CapabilityInput): boolean {
  return getEntitlements(input).capabilities.apiAccess;
}

export function canUseAuditLogs(input: CapabilityInput): boolean {
  return getEntitlements(input).capabilities.auditLogs;
}

export function hasReachedUserLimit(input: CapabilityInput): boolean {
  const usage: UsageSnapshot | undefined = input.usage;
  if (usage == null) return false;
  const max = getEntitlements(input).limits.maxUsers;
  return usage.activeUsersCount >= max;
}

export function hasReachedProjectLimit(input: CapabilityInput): boolean {
  const usage = input.usage;
  if (usage == null) return false;
  const max = getEntitlements(input).limits.maxProjects;
  return usage.activeProjectsCount >= max;
}

export function hasReachedStorageLimit(input: CapabilityInput): boolean {
  const usage = input.usage;
  if (usage == null) return false;
  const max = getEntitlements(input).limits.maxStorageGb;
  return usage.storageUsedGb >= max;
}

export function hasReachedAiLimit(input: CapabilityInput): boolean {
  const usage = input.usage;
  if (usage == null) return false;
  const max = getEntitlements(input).limits.maxMonthlyAiRequests;
  return usage.aiRequestsCount >= max;
}
