/**
 * Billing pilot eligibility resolution (Step 18).
 * Combines global provider flags, config, and workspace cohort.
 * Live billing only when global ready AND workspace in pilot.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getBillingProviderRuntimeConfig } from "./billing-provider-config";
import { getStripeWebhookIngressConfig } from "./billing-provider-config";
import { getWorkspacePilotStatus } from "./billing-pilot.repository";
import type { BillingPilotDecision, BillingPilotDiagnostics, BillingPilotMode } from "./billing-pilot.types";

/**
 * Resolve billing pilot eligibility for a workspace.
 * Live checkout and webhook processing require both global readiness and workspace in pilot.
 */
export async function resolveBillingPilotEligibility(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<BillingPilotDecision> {
  const runtime = getBillingProviderRuntimeConfig();
  const webhookConfig = getStripeWebhookIngressConfig();
  const pilot = await getWorkspacePilotStatus(supabase, workspaceId);

  if (!workspaceId) {
    return {
      liveCheckoutEligible: false,
      webhookProcessingEligible: false,
      mode: "sandbox",
      reason: "missing_workspace",
      fallbackMode: "sandbox",
      inPilotCohort: false,
    };
  }

  if (!runtime.flagEnabled) {
    return {
      liveCheckoutEligible: false,
      webhookProcessingEligible: false,
      mode: "sandbox",
      reason: "feature_flag_disabled",
      fallbackMode: "sandbox",
      inPilotCohort: pilot.inCohort,
    };
  }

  if (!runtime.configValid) {
    return {
      liveCheckoutEligible: false,
      webhookProcessingEligible: false,
      mode: "sandbox",
      reason: "provider_config_invalid",
      fallbackMode: "sandbox",
      inPilotCohort: pilot.inCohort,
    };
  }

  if (!pilot.inCohort) {
    return {
      liveCheckoutEligible: false,
      webhookProcessingEligible: false,
      mode: "provider_stub",
      reason: "workspace_not_allowlisted",
      fallbackMode: "provider_stub",
      inPilotCohort: false,
    };
  }

  if (!runtime.liveCheckoutEnabled) {
    return {
      liveCheckoutEligible: false,
      webhookProcessingEligible: false,
      mode: "provider_stub",
      reason: "live_checkout_disabled",
      fallbackMode: "provider_stub",
      inPilotCohort: true,
    };
  }

  const webhookEligible =
    webhookConfig.enabled &&
    webhookConfig.webhookSecretValid &&
    pilot.webhookProcessingEnabled;

  return {
    liveCheckoutEligible: true,
    webhookProcessingEligible: webhookEligible,
    mode: "provider_live",
    reason: "pilot_cohort_eligible",
    fallbackMode: "provider_stub",
    inPilotCohort: true,
  };
}

/**
 * Get pilot decision with full diagnostics.
 */
export async function getBillingPilotDiagnostics(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<BillingPilotDiagnostics> {
  const runtime = getBillingProviderRuntimeConfig();
  const webhookConfig = getStripeWebhookIngressConfig();
  const pilot = await getWorkspacePilotStatus(supabase, workspaceId);

  const decision = await resolveBillingPilotEligibility(supabase, workspaceId);

  let reason = decision.reason;
  if (pilot.inCohort && runtime.liveCheckoutEnabled && runtime.configValid) {
    reason = "workspace_allowlisted";
  }
  if (!webhookConfig.enabled && pilot.inCohort && runtime.configValid) {
    reason = decision.reason; // keep as-is
  }

  return {
    workspaceId,
    inPilotCohort: pilot.inCohort,
    liveCheckoutEligible: decision.liveCheckoutEligible,
    webhookProcessingEligible: decision.webhookProcessingEligible,
    mode: decision.mode,
    reason: decision.reason,
    globalProviderEnabled: runtime.flagEnabled,
    globalLiveCheckoutEnabled: runtime.liveCheckoutEnabled,
    globalWebhookIngressEnabled: webhookConfig.enabled,
    configValid: runtime.configValid,
  };
}

/**
 * Resolve live billing mode for a workspace (for checkout path).
 * Returns "provider_live" only when eligible; otherwise "provider_stub" or "sandbox".
 */
export async function resolveLiveBillingModeForWorkspace(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<BillingPilotMode> {
  const decision = await resolveBillingPilotEligibility(supabase, workspaceId);
  return decision.mode;
}
