/**
 * Domain types for subscription foundation (types only, no persistence).
 */

import type { PlanCode, EntitlementLimits } from "@aistroyka/contracts";
import type { EntitlementCapabilities } from "./entitlements.types";

export type BillingCycle = "monthly" | "annual";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete";

export type SubscriptionProvider = "stripe" | "paddle" | "revenuecat" | "internal";

export interface Subscription {
  id: string;
  workspaceId: string;
  planCode: PlanCode;
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  provider: SubscriptionProvider;
  externalSubscriptionId: string | null;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
}

export interface WorkspaceEntitlements {
  workspaceId: string;
  sourcePlanCode: PlanCode;
  addOnCodes: string[];
  limits: EntitlementLimits;
  capabilities: EntitlementCapabilities;
  effectiveFrom: string;
  effectiveTo: string | null;
}

export interface PlanRecommendation {
  id: string;
  userId: string;
  workspaceId: string | null;
  inputSnapshot: unknown;
  recommendedPlanCode: PlanCode;
  alternativePlanCodes: PlanCode[];
  enterpriseSignal: boolean;
  reasoningCodes: string[];
  createdAt: string;
}

export interface UsageCounters {
  workspaceId: string;
  activeUsersCount: number;
  activeProjectsCount: number;
  storageUsedGb: number;
  aiRequestsCount: number;
  periodKey: string;
}
