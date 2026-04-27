/**
 * Billing readiness domain model (Step 12).
 * Provider-agnostic. No real checkout/provider integration.
 *
 * Separation of concerns:
 * - Selected plan: what user/system chose (workspace_plan_state)
 * - Billing subscription: commercial/payment state (provider-agnostic lifecycle)
 * - Effective entitlements: what workspace actually has at runtime (plan-fit resolution)
 */

import type { PlanCode } from "@aistroyka/contracts";

// ─── Status enums ───────────────────────────────────────────────────────────

export type BillingSubscriptionStatus =
  | "pending"
  | "trialing"
  | "active"
  | "past_due"
  | "cancelled"
  | "expired"
  | "incomplete"
  | "paused"
  | "unknown";

export type BillingCheckoutSessionStatus =
  | "created"
  | "pending_redirect"
  | "completed"
  | "cancelled"
  | "expired"
  | "failed";

export type BillingProviderKind = "none" | "stripe" | "paddle" | "manual" | "legacy" | "sandbox";

export type BillingCycle = "monthly" | "annual" | "custom";

export type BillingEventProcessingStatus = "pending" | "processed" | "failed" | "skipped";

export type TrialStatus = "not_started" | "active" | "expired" | "converted" | "cancelled";

// ─── Domain entities ────────────────────────────────────────────────────────

export interface BillingCustomer {
  workspaceId: string;
  providerCustomerRef: string | null;
  billingEmail: string | null;
  status: string;
  meta: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface BillingSubscription {
  id: string;
  workspaceId: string;
  canonicalPlanCode: PlanCode;
  billingProvider: BillingProviderKind;
  providerSubscriptionRef: string | null;
  status: BillingSubscriptionStatus;
  billingCycle: BillingCycle;
  trialStatus: TrialStatus | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BillingCheckoutSession {
  id: string;
  workspaceId: string;
  targetPlanCode: PlanCode;
  requestedBillingCycle: BillingCycle;
  status: BillingCheckoutSessionStatus;
  providerSessionRef: string | null;
  returnUrl: string;
  cancelUrl: string;
  createdByUserId: string | null;
  createdAt: string;
  expiresAt: string | null;
  metadata: Record<string, unknown>;
}

export interface BillingEvent {
  id: string;
  workspaceId: string | null;
  billingProvider: BillingProviderKind;
  providerEventRef: string | null;
  eventType: string;
  eventPayloadSnapshot: Record<string, unknown>;
  processingStatus: BillingEventProcessingStatus;
  processedAt: string | null;
  receivedAt: string;
  errorInfo: string | null;
}

export interface TrialState {
  id: string;
  workspaceId: string;
  kind: string;
  status: TrialStatus;
  startedAt: string;
  endsAt: string;
  source: string;
  trialPlanCode: PlanCode;
  convertedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}
