/**
 * Tests for billing route behavior: 503 when Stripe not configured, webhook signature verification.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { BILLING_503_BODY } from "@/lib/platform/billing/billing-responses";

describe("billing 503 when not configured", () => {
  it("BILLING_503_BODY has stable shape", () => {
    expect(BILLING_503_BODY).toEqual({
      error: "service_unavailable",
      code: "stripe_not_configured",
    });
  });
});

describe("webhook verification", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("verifyWebhookEvent returns null when signature missing", async () => {
    const { verifyWebhookEvent } = await import("@/lib/platform/billing/webhooks.handler");
    const result = verifyWebhookEvent("{}", null);
    expect(result).toBeNull();
  });

  it("verifyWebhookEvent returns null when payload empty and secret not set", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");
    const { verifyWebhookEvent } = await import("@/lib/platform/billing/webhooks.handler");
    const result = verifyWebhookEvent("", "sig");
    expect(result).toBeNull();
  });
});
