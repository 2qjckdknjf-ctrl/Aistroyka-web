/**
 * Billing pilot rollout model (Step 18).
 * Workspace-level eligibility for live billing.
 * No global rollout; live billing only for pilot cohort.
 */

export type BillingPilotReason =
  | "feature_flag_disabled"
  | "provider_config_invalid"
  | "workspace_not_allowlisted"
  | "workspace_allowlisted"
  | "missing_workspace"
  | "webhook_ingress_disabled"
  | "live_checkout_disabled"
  | "pilot_cohort_eligible";

export type BillingPilotMode = "sandbox" | "provider_stub" | "provider_live";

export interface BillingPilotDecision {
  liveCheckoutEligible: boolean;
  webhookProcessingEligible: boolean;
  mode: BillingPilotMode;
  reason: BillingPilotReason;
  fallbackMode: BillingPilotMode;
  inPilotCohort: boolean;
}

export interface BillingPilotDiagnostics {
  workspaceId: string | null;
  inPilotCohort: boolean;
  liveCheckoutEligible: boolean;
  webhookProcessingEligible: boolean;
  mode: BillingPilotMode;
  reason: BillingPilotReason;
  globalProviderEnabled: boolean;
  globalLiveCheckoutEnabled: boolean;
  globalWebhookIngressEnabled: boolean;
  configValid: boolean;
}
