/**
 * Stripe billing adapter (Step 15, Step 16).
 * Feature-gated. Live checkout behind ENABLE_STRIPE_LIVE_CHECKOUT.
 * Skeleton when live off; real session creation when live on + valid config + price mapping.
 */

import type {
  BillingProviderAdapter,
  AdapterCreateCheckoutInput,
  AdapterCreateCheckoutResult,
  AdapterEventInput,
  AdapterEventTranslationResult,
} from "./billing-adapter.types";
import { getBillingProviderRuntimeConfig } from "./billing-provider-config";
import { validateStripePriceMapping } from "./stripe-price-mapping";
import type { PlanCode } from "@aistroyka/contracts";
import Stripe from "stripe";

// ─── Stripe event type mapping (skeleton) ────────────────────────────────────

/** Known Stripe event types for translation boundary. */
export const STRIPE_EVENT_TYPES = {
  CHECKOUT_COMPLETED: "checkout.session.completed",
  CHECKOUT_EXPIRED: "checkout.session.expired",
  SUBSCRIPTION_CREATED: "customer.subscription.created",
  SUBSCRIPTION_UPDATED: "customer.subscription.updated",
  SUBSCRIPTION_DELETED: "customer.subscription.deleted",
} as const;

/** Minimal Stripe event payload shape for translation. */
export interface StripeEventPayload {
  id?: string;
  type?: string;
  data?: { object?: Record<string, unknown> };
  object?: Record<string, unknown>;
}

// ─── Adapter ─────────────────────────────────────────────────────────────────

export const stripeBillingAdapter: BillingProviderAdapter = {
  getProviderKind() {
    return "stripe";
  },

  async createCheckoutSession(input: AdapterCreateCheckoutInput): Promise<AdapterCreateCheckoutResult> {
    const runtime = getBillingProviderRuntimeConfig();
    if (runtime.providerKind !== "stripe" || !runtime.stripeConfig) {
      return {
        success: false,
        status: "fallback",
        mode: "provider_disabled_fallback",
        message: runtime.fallbackReason ?? "Stripe provider not configured",
      };
    }

    if (input.liveCheckoutEligible === false) {
      return {
        success: true,
        sessionId: input.sessionId,
        providerSessionRef: null,
        redirectUrl: null,
        status: "stub",
        mode: "provider_ready_stub",
        message: "Stripe adapter: workspace not in pilot cohort. Live checkout disabled for this workspace.",
      };
    }
    if (!runtime.liveCheckoutEnabled) {
      return {
        success: true,
        sessionId: input.sessionId,
        providerSessionRef: null,
        redirectUrl: null,
        status: "stub",
        mode: "provider_ready_stub",
        message: "Stripe adapter: live checkout disabled. Use sandbox or set ENABLE_STRIPE_LIVE_CHECKOUT.",
      };
    }

    const priceValidation = validateStripePriceMapping(input.targetPlanCode, input.requestedBillingCycle);
    if (!priceValidation.valid) {
      return {
        success: false,
        status: "error",
        mode: "provider_disabled_fallback",
        message: priceValidation.error ?? "Missing price mapping",
      };
    }

    try {
      const stripe = new Stripe(runtime.stripeConfig.secretKey, { apiVersion: "2023-10-16" });
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: priceValidation.priceId!, quantity: 1 }],
        success_url: input.returnUrl,
        cancel_url: input.cancelUrl,
        metadata: {
          workspace_id: input.workspaceId,
          target_plan_code: input.targetPlanCode,
          internal_checkout_session_id: input.sessionId ?? "",
          billing_cycle: input.requestedBillingCycle,
        },
      });

      const redirectUrl = session.url ?? null;
      const providerSessionRef = session.id ?? null;

      return {
        success: true,
        sessionId: input.sessionId,
        providerSessionRef,
        redirectUrl,
        status: redirectUrl ? "pending_redirect" : "created",
        mode: "provider_live_checkout",
        message: redirectUrl ? "Redirect to Stripe checkout" : "Session created",
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Stripe API error";
      return {
        success: false,
        status: "error",
        mode: "provider_disabled_fallback",
        message: `Stripe checkout failed: ${message}`,
      };
    }
  },

  async translateProviderEvent(input: AdapterEventInput): Promise<AdapterEventTranslationResult | null> {
    const runtime = getBillingProviderRuntimeConfig();
    if (runtime.providerKind !== "stripe") return null;

    const eventType = input.eventType;
    const payload = input.payload as StripeEventPayload;
    const obj = payload?.data?.object ?? payload?.object ?? {};

    switch (eventType) {
      case STRIPE_EVENT_TYPES.CHECKOUT_COMPLETED: {
        const session = obj as { id?: string; customer?: string; subscription?: string; metadata?: Record<string, string> };
        const sessionId = session?.id ?? (payload?.id as string) ?? null;
        const workspaceId = (session?.metadata?.workspace_id ?? input.workspaceId) ?? null;
        const planCode = (session?.metadata?.target_plan_code ?? session?.metadata?.plan_code) as PlanCode | undefined;
        const billingCycle = session?.metadata?.billing_cycle ?? null;
        return {
          canonicalEventType: `stripe.${eventType}`,
          workspaceId,
          checkoutAction: "complete",
          planCode,
          sessionId,
          billingCycle,
        };
      }
      case STRIPE_EVENT_TYPES.CHECKOUT_EXPIRED: {
        const session = obj as { id?: string; metadata?: Record<string, string> };
        const sessionId = session?.id ?? (payload?.id as string) ?? null;
        return {
          canonicalEventType: `stripe.${eventType}`,
          workspaceId: (session?.metadata?.workspace_id as string) ?? input.workspaceId ?? null,
          checkoutAction: "cancel",
          sessionId,
        };
      }
      case STRIPE_EVENT_TYPES.SUBSCRIPTION_CREATED:
      case STRIPE_EVENT_TYPES.SUBSCRIPTION_UPDATED: {
        const sub = obj as { status?: string; metadata?: Record<string, string> };
        const workspaceId = (sub?.metadata?.workspace_id ?? input.workspaceId) ?? null;
        const planCode = sub?.metadata?.plan_code as PlanCode | undefined;
        if (sub?.status === "active" || sub?.status === "trialing") {
          return {
            canonicalEventType: `stripe.${eventType}`,
            workspaceId,
            subscriptionAction: "activate",
            planCode,
          };
        }
        return {
          canonicalEventType: `stripe.${eventType}`,
          workspaceId,
          subscriptionAction: "update",
        };
      }
      case STRIPE_EVENT_TYPES.SUBSCRIPTION_DELETED: {
        const sub = obj as { id?: string; metadata?: Record<string, string> };
        return {
          canonicalEventType: `stripe.${eventType}`,
          workspaceId: (sub?.metadata?.workspace_id ?? input.workspaceId) ?? null,
          subscriptionAction: "cancel",
          providerSubscriptionRef: sub?.id ?? null,
        };
      }
      default:
        return null;
    }
  },
};
