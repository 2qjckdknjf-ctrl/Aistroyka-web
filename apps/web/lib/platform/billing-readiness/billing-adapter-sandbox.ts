/**
 * Sandbox billing adapter (Step 13).
 * No external API calls. Simulates checkout flow for local/testing.
 * Safe placeholder redirect; no real payment.
 */

import type {
  BillingProviderAdapter,
  AdapterCreateCheckoutInput,
  AdapterCreateCheckoutResult,
  AdapterEventInput,
  AdapterEventTranslationResult,
} from "./billing-adapter.types";

const SANDBOX_EVENT_PREFIX = "sandbox.";

function isSandboxEventType(eventType: string): boolean {
  return eventType.startsWith(SANDBOX_EVENT_PREFIX);
}

export const sandboxBillingAdapter: BillingProviderAdapter = {
  getProviderKind() {
    return "sandbox";
  },

  async createCheckoutSession(input: AdapterCreateCheckoutInput): Promise<AdapterCreateCheckoutResult> {
    return {
      success: true,
      sessionId: input.sessionId,
      providerSessionRef: input.sessionId ? `sandbox_${input.sessionId}` : null,
      redirectUrl: undefined,
      status: "created",
      mode: "sandbox_simulation",
      message: "Sandbox: no external checkout. Use sandbox complete/cancel to simulate.",
    };
  },

  async translateProviderEvent(input: AdapterEventInput): Promise<AdapterEventTranslationResult | null> {
    if (!isSandboxEventType(input.eventType)) return null;
    const parts = input.eventType.split(".");
    if (parts.length < 3) return null;
    const [, domain, action] = parts;
    const workspaceId = (input.payload.workspaceId as string) ?? input.workspaceId ?? null;
    const planCode = input.payload.planCode as string | undefined;

    if (domain === "checkout") {
      if (action === "completed") {
        return {
          canonicalEventType: input.eventType,
          workspaceId,
          checkoutAction: "complete",
          planCode: planCode as import("@aistroyka/contracts").PlanCode | undefined,
        };
      }
      if (action === "cancelled") {
        return {
          canonicalEventType: input.eventType,
          workspaceId,
          checkoutAction: "cancel",
        };
      }
    }
    if (domain === "subscription") {
      if (action === "activated") {
        return {
          canonicalEventType: input.eventType,
          workspaceId,
          subscriptionAction: "activate",
          planCode: planCode as import("@aistroyka/contracts").PlanCode | undefined,
        };
      }
      if (action === "cancelled") {
        return {
          canonicalEventType: input.eventType,
          workspaceId,
          subscriptionAction: "cancel",
        };
      }
    }
    return null;
  },
};
