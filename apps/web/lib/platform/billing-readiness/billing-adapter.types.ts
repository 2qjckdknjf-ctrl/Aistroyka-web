/**
 * Provider-agnostic billing adapter interface (Step 13).
 * Abstraction for future Stripe/Paddle adapters.
 * Sandbox/manual adapter implements this without external API calls.
 */

import type { PlanCode } from "@aistroyka/contracts";
import type { BillingProviderKind, BillingCycle } from "./billing-readiness.types";

// ─── Adapter create checkout ─────────────────────────────────────────────────

export interface AdapterCreateCheckoutInput {
  workspaceId: string;
  targetPlanCode: PlanCode;
  requestedBillingCycle: BillingCycle;
  returnUrl: string;
  cancelUrl: string;
  createdByUserId?: string | null;
  sessionId?: string; // For sandbox: pre-created session id
  /** Step 18: when false, adapter must return stub (no live checkout) even if global flags on */
  liveCheckoutEligible?: boolean;
}

export type AdapterCheckoutMode =
  | "readiness_placeholder"
  | "sandbox_simulation"
  | "real_checkout"
  | "provider_disabled_fallback"
  | "provider_ready_stub"
  | "provider_live_checkout";

export interface AdapterCreateCheckoutResult {
  success: boolean;
  sessionId?: string;
  providerSessionRef?: string | null;
  redirectUrl?: string | null;
  status: string;
  mode: AdapterCheckoutMode;
  message?: string;
}

// ─── Adapter event translation ──────────────────────────────────────────────

export interface AdapterEventInput {
  providerEventRef: string | null;
  eventType: string;
  payload: Record<string, unknown>;
  workspaceId?: string | null;
}

export interface AdapterEventTranslationResult {
  canonicalEventType: string;
  workspaceId: string | null;
  subscriptionAction?: "activate" | "update" | "cancel" | "expire";
  checkoutAction?: "complete" | "cancel";
  planCode?: PlanCode;
  skipProcessing?: boolean;
  /** Provider-extracted session id (e.g. Stripe checkout session id). */
  sessionId?: string | null;
  /** Provider-extracted billing cycle from metadata. */
  billingCycle?: string | null;
  /** Provider subscription ref (e.g. Stripe sub_ id) for lookup when workspace unknown. */
  providerSubscriptionRef?: string | null;
}

// ─── Adapter subscription sync ──────────────────────────────────────────────

export interface AdapterSubscriptionSyncInput {
  workspaceId: string;
  planCode: PlanCode;
  billingCycle: BillingCycle;
  providerSubscriptionRef?: string | null;
}

export interface AdapterSubscriptionSyncResult {
  success: boolean;
  subscriptionId?: string;
  status: string;
  error?: string;
}

// ─── Adapter interface ──────────────────────────────────────────────────────

export interface BillingProviderAdapter {
  getProviderKind(): BillingProviderKind;

  createCheckoutSession(input: AdapterCreateCheckoutInput): Promise<AdapterCreateCheckoutResult>;

  getCheckoutSession?(sessionId: string): Promise<{ status: string; providerSessionRef?: string | null } | null>;

  translateProviderEvent?(input: AdapterEventInput): Promise<AdapterEventTranslationResult | null>;

  recordOrTranslateEvent?(input: AdapterEventInput): Promise<{ eventType: string; payload: Record<string, unknown> } | null>;
}
