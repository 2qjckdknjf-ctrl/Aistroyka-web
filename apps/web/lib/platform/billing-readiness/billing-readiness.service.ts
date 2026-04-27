/**
 * Billing readiness application services (Step 12).
 * Provider-agnostic. No real checkout or provider calls.
 *
 * Separation:
 * - Selected plan: workspace_plan_state (what user chose)
 * - Billing subscription: billing_readiness_subscriptions (commercial state)
 * - Effective entitlements: plan-fit resolution (runtime access)
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlanCode } from "@aistroyka/contracts";
import { getWorkspaceSelectedPlanState } from "@/lib/platform/plan-fit/persistence/workspace-plan-state.repository";
import { getPlanSurfaceViewModel } from "@/lib/platform/plan-fit/plan-surface";
import { getWorkspacePlanContextFromRuntime } from "@/lib/platform/plan-fit";
import {
  createBillingCheckoutSession,
  updateBillingCheckoutSessionStatus,
  updateBillingCheckoutSessionProviderRef,
  getCurrentBillingSubscription,
  getBillingCustomerByWorkspace,
  createBillingEventRecord,
} from "./billing-readiness.repository";
import type {
  CreateCheckoutSessionRequest,
  CreateCheckoutSessionResponse,
  BillingOverviewResponse,
  BillingStateResponse,
} from "./billing-readiness.contracts";
import type { BillingProviderKind } from "./billing-readiness.types";
import { getDefaultBillingAdapter, getBillingAdapterDiagnostics } from "./billing-adapter-registry";
import {
  resolveBillingPilotEligibility,
  getBillingPilotDiagnostics,
} from "./billing-pilot-resolution.service";

const VALID_PLAN_CODES: PlanCode[] = [
  "client_personal",
  "team_contractor",
  "business_operations",
  "enterprise",
];

function isValidPlanCode(code: string): code is PlanCode {
  return VALID_PLAN_CODES.includes(code as PlanCode);
}

/**
 * Create checkout session via adapter (Step 13).
 * Uses provider adapter (default: sandbox). No real provider call or redirect.
 */
export async function createBillingCheckoutSessionService(
  supabase: SupabaseClient,
  input: {
    workspaceId: string;
    request: CreateCheckoutSessionRequest;
    createdByUserId?: string | null;
  }
): Promise<{ data: CreateCheckoutSessionResponse; error: string | null }> {
  if (!isValidPlanCode(input.request.targetPlanCode)) {
    return { data: null as never, error: "Invalid target plan code" };
  }

  const selected = await getWorkspaceSelectedPlanState(supabase, input.workspaceId);
  if (!selected) {
    return { data: null as never, error: "Workspace has no selected plan" };
  }

  const { data: session, error } = await createBillingCheckoutSession(supabase, {
    workspaceId: input.workspaceId,
    targetPlanCode: input.request.targetPlanCode,
    requestedBillingCycle: input.request.billingCycle,
    returnUrl: input.request.returnUrl,
    cancelUrl: input.request.cancelUrl,
    createdByUserId: input.createdByUserId,
    metadata: { mode: "sandbox_simulation" },
  });

  if (error || !session) {
    return { data: null as never, error: error ?? "Failed to create checkout session" };
  }

  const pilot = await resolveBillingPilotEligibility(supabase, input.workspaceId);
  const adapter = getDefaultBillingAdapter();
  const adapterResult = await adapter.createCheckoutSession({
    workspaceId: input.workspaceId,
    targetPlanCode: input.request.targetPlanCode,
    requestedBillingCycle: input.request.billingCycle,
    returnUrl: input.request.returnUrl,
    cancelUrl: input.request.cancelUrl,
    createdByUserId: input.createdByUserId,
    sessionId: session.id,
    liveCheckoutEligible: pilot.liveCheckoutEligible,
  });

  if (!adapterResult.success) {
    return {
      data: null as never,
      error: adapterResult.message ?? "Adapter checkout failed",
    };
  }

  if (adapterResult.providerSessionRef && session.id) {
    await updateBillingCheckoutSessionProviderRef(supabase, session.id, adapterResult.providerSessionRef);
    if (adapterResult.redirectUrl) {
      await updateBillingCheckoutSessionStatus(supabase, session.id, "pending_redirect");
    }
  }

  return {
    data: {
      checkoutSessionId: session.id,
      status: adapterResult.status as CreateCheckoutSessionResponse["status"],
      redirectUrl: adapterResult.redirectUrl ?? undefined,
      providerKind: adapter.getProviderKind(),
      message: adapterResult.message,
      mode: adapterResult.mode,
    },
    error: null,
  };
}

/**
 * Get workspace billing overview.
 * Combines selected plan, billing subscription (if any), trial (if any), readiness flags.
 */
export async function getWorkspaceBillingOverview(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<BillingOverviewResponse> {
  const selected = await getWorkspaceSelectedPlanState(supabase, workspaceId);
  const subscription = await getCurrentBillingSubscription(supabase, workspaceId);
  const customer = await getBillingCustomerByWorkspace(supabase, workspaceId);

  const hasLegacyBilling =
    customer != null &&
    (customer.providerCustomerRef != null || customer.status !== "none");
  const hasActiveSubscription = subscription != null && ["active", "trialing"].includes(subscription.status);

  const context = await getWorkspacePlanContextFromRuntime(supabase, workspaceId);
  const surface = getPlanSurfaceViewModel(context);

  const allowedActions: string[] = ["view_plan", "explore_options"];
  if (!hasActiveSubscription && selected) {
    allowedActions.push("request_upgrade"); // Informational; no real checkout
  }

  const defaultAdapter = getDefaultBillingAdapter();
  const providerKind = defaultAdapter.getProviderKind();
  const diag = getBillingAdapterDiagnostics();
  const pilot = await getBillingPilotDiagnostics(supabase, workspaceId);

  const sandboxMode = pilot.mode === "sandbox";
  const effectiveCheckoutMode = pilot.mode;

  return {
    selectedPlan: {
      canonicalPlanCode: selected?.canonicalPlanCode ?? ("client_personal" as PlanCode),
      sourceKind: selected?.sourceKind ?? "manual_backend_set",
      selectedAt: selected?.selectedAt,
    },
    billingSubscription: subscription
      ? {
          status: subscription.status,
          billingProvider: subscription.billingProvider,
          canonicalPlanCode: subscription.canonicalPlanCode,
          currentPeriodEnd: subscription.currentPeriodEnd,
        }
      : null,
    trialState: null, // No trial state in readiness; would come from trial table
    readinessFlags: {
      checkoutEnabled: false, // Never true for real payment
      sandboxMode,
      billingConnected: hasLegacyBilling,
      hasActiveSubscription,
      activeAdapterKind: diag.activeAdapterKind,
      providerConfigured: diag.providerKind === "stripe" && diag.configValid,
      liveCheckoutEnabled: pilot.liveCheckoutEligible ?? false,
      checkoutMode: effectiveCheckoutMode,
      inPilotCohort: pilot.inPilotCohort,
      pilotReason: pilot.reason,
    },
    allowedActions,
    planSurfaceSummary: {
      currentPlanCode: surface.currentPlanCode,
      humanReadablePlanName: surface.humanReadablePlanName,
    },
  };
}

/**
 * Get workspace billing state (domain-centric).
 */
export async function getWorkspaceBillingState(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<BillingStateResponse> {
  const selected = await getWorkspaceSelectedPlanState(supabase, workspaceId);
  const subscription = await getCurrentBillingSubscription(supabase, workspaceId);

  return {
    workspaceId,
    selectedPlanCode: selected?.canonicalPlanCode ?? null,
    billingSubscriptionId: subscription?.id ?? null,
    billingSubscriptionStatus: subscription?.status ?? null,
    trialStatus: null,
    checkoutAvailable: false,
  };
}

/**
 * Record billing event (readiness/testing/manual future ingestion).
 * No provider webhook; internal service only.
 */
export async function recordBillingEvent(
  supabase: SupabaseClient,
  input: {
    workspaceId?: string | null;
    billingProvider: BillingProviderKind;
    providerEventRef?: string | null;
    eventType: string;
    eventPayloadSnapshot?: Record<string, unknown>;
  }
): Promise<{ data: { id: string }; error: string | null }> {
  const { data, error } = await createBillingEventRecord(supabase, input);
  if (error || !data) return { data: null as never, error: error ?? "Failed to record event" };
  return { data: { id: data.id }, error: null };
}
