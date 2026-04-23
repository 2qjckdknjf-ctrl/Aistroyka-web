/**
 * Billing pilot ops / observability model (Step 19).
 * Internal admin tooling. No user-facing.
 */

import type { BillingPilotMode, BillingPilotReason } from "./billing-pilot.types";
import type { BillingCheckoutSessionStatus, BillingSubscriptionStatus, BillingEventProcessingStatus } from "./billing-readiness.types";

export interface BillingPilotWorkspaceSummary {
  workspaceId: string;
  inPilotCohort: boolean;
  liveCheckoutEnabled: boolean;
  webhookProcessingEnabled: boolean;
  cohortLabel: string | null;
  source: "db" | "env" | "none";
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface BillingPilotCheckoutSummary {
  id: string;
  status: BillingCheckoutSessionStatus;
  targetPlanCode: string;
  providerSessionRef: string | null;
  createdAt: string;
}

export interface BillingPilotSubscriptionSummary {
  id: string;
  status: BillingSubscriptionStatus;
  canonicalPlanCode: string;
  billingProvider: string;
  providerSubscriptionRef: string | null;
}

export interface BillingPilotEventSummary {
  id: string;
  eventType: string;
  processingStatus: BillingEventProcessingStatus;
  receivedAt: string;
  errorInfo: string | null;
}

export interface BillingPilotEventCounts {
  pending: number;
  processed: number;
  failed: number;
  skipped: number;
}

export interface BillingPilotWorkspaceDiagnostics {
  workspaceId: string;
  inPilotCohort: boolean;
  liveCheckoutEligible: boolean;
  webhookProcessingEligible: boolean;
  mode: BillingPilotMode;
  reason: BillingPilotReason;
  activeAdapterKind: string;
  checkoutMode: string;
  selectedPlanCode: string | null;
  latestCheckout: BillingPilotCheckoutSummary | null;
  currentSubscription: BillingPilotSubscriptionSummary | null;
  eventCounts: BillingPilotEventCounts;
  lastFailureReason: string | null;
  recentEvents: BillingPilotEventSummary[];
}

export type BillingPilotOpsAction =
  | "add_to_pilot"
  | "remove_from_pilot"
  | "update_pilot"
  | "reprocess_event"
  | "reprocess_workspace_events";

export type BillingPilotOpsStatus = "ok" | "partial" | "failed";
