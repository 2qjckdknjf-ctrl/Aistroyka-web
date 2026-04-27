import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { verifyStripeWebhookSignature, isStripeWebhookIngressReady } from "./stripe-webhook-verification";

function setEnv(key: string, value: string) {
  process.env[key] = value;
}
function deleteEnv(key: string) {
  delete process.env[key];
}

describe("stripe-webhook-verification (Step 17)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    deleteEnv("ENABLE_STRIPE_BILLING_PROVIDER");
    deleteEnv("ENABLE_STRIPE_WEBHOOK_INGRESS");
    deleteEnv("STRIPE_SECRET_KEY");
    deleteEnv("STRIPE_WEBHOOK_SECRET");
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns null when webhook ingress not enabled", () => {
    const result = verifyStripeWebhookSignature('{"id":"evt_1"}', "sig");
    expect(result).toBeNull();
  });

  it("returns null when signature missing", () => {
    setEnv("ENABLE_STRIPE_BILLING_PROVIDER", "true");
    setEnv("ENABLE_STRIPE_WEBHOOK_INGRESS", "true");
    setEnv("STRIPE_SECRET_KEY", "sk_test_xxx");
    setEnv("STRIPE_WEBHOOK_SECRET", "whsec_xxx");
    const result = verifyStripeWebhookSignature('{"id":"evt_1"}', null);
    expect(result).toBeNull();
  });

  it("returns null when signature invalid", () => {
    setEnv("ENABLE_STRIPE_BILLING_PROVIDER", "true");
    setEnv("ENABLE_STRIPE_WEBHOOK_INGRESS", "true");
    setEnv("STRIPE_SECRET_KEY", "sk_test_xxx");
    setEnv("STRIPE_WEBHOOK_SECRET", "whsec_xxx");
    const result = verifyStripeWebhookSignature('{"id":"evt_1"}', "invalid_sig");
    expect(result).toBeNull();
  });

  it("isStripeWebhookIngressReady false when flags off", () => {
    setEnv("STRIPE_SECRET_KEY", "sk_test_xxx");
    setEnv("STRIPE_WEBHOOK_SECRET", "whsec_xxx");
    expect(isStripeWebhookIngressReady()).toBe(false);
  });

  it("isStripeWebhookIngressReady true when flags and config valid", () => {
    setEnv("ENABLE_STRIPE_BILLING_PROVIDER", "true");
    setEnv("ENABLE_STRIPE_WEBHOOK_INGRESS", "true");
    setEnv("STRIPE_SECRET_KEY", "sk_test_xxx");
    setEnv("STRIPE_WEBHOOK_SECRET", "whsec_xxx");
    expect(isStripeWebhookIngressReady()).toBe(true);
  });
});
