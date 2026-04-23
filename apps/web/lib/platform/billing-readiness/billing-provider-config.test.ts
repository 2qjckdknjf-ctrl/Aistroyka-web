import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  isStripeBillingProviderFlagEnabled,
  getStripeBillingConfig,
  isStripeBillingConfigured,
  getBillingProviderRuntimeConfig,
  isStripeWebhookIngressFlagEnabled,
  getStripeWebhookIngressConfig,
} from "./billing-provider-config";

const FLAG = "ENABLE_STRIPE_BILLING_PROVIDER";
const FLAG_WEBHOOK = "ENABLE_STRIPE_WEBHOOK_INGRESS";
const SECRET = "STRIPE_SECRET_KEY";
const WEBHOOK = "STRIPE_WEBHOOK_SECRET";

function setEnv(key: string, value: string) {
  process.env[key] = value;
}
function deleteEnv(key: string) {
  delete process.env[key];
}

describe("billing-provider-config", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    deleteEnv(FLAG);
    deleteEnv(FLAG_WEBHOOK);
    deleteEnv(SECRET);
    deleteEnv(WEBHOOK);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("isStripeBillingProviderFlagEnabled", () => {
    it("returns false when flag unset", () => {
      expect(isStripeBillingProviderFlagEnabled()).toBe(false);
    });

    it("returns true when flag is true", () => {
      setEnv(FLAG, "true");
      expect(isStripeBillingProviderFlagEnabled()).toBe(true);
    });

    it("returns true when flag is 1", () => {
      setEnv(FLAG, "1");
      expect(isStripeBillingProviderFlagEnabled()).toBe(true);
    });

    it("returns true when flag is yes", () => {
      setEnv(FLAG, "yes");
      expect(isStripeBillingProviderFlagEnabled()).toBe(true);
    });
  });

  describe("getStripeBillingConfig", () => {
    it("returns invalid when STRIPE_SECRET_KEY missing", () => {
      const r = getStripeBillingConfig();
      expect(r.valid).toBe(false);
      expect(r.reason).toContain("STRIPE_SECRET_KEY");
    });

    it("returns invalid when secret key wrong format", () => {
      setEnv(SECRET, "invalid");
      setEnv(WEBHOOK, "whsec_xxx");
      const r = getStripeBillingConfig();
      expect(r.valid).toBe(false);
      expect(r.reason).toContain("invalid format");
    });

    it("returns invalid when STRIPE_WEBHOOK_SECRET missing", () => {
      setEnv(SECRET, "sk_test_xxx");
      const r = getStripeBillingConfig();
      expect(r.valid).toBe(false);
      expect(r.reason).toContain("STRIPE_WEBHOOK_SECRET");
    });

    it("returns invalid when webhook secret wrong format", () => {
      setEnv(SECRET, "sk_test_xxx");
      setEnv(WEBHOOK, "invalid");
      const r = getStripeBillingConfig();
      expect(r.valid).toBe(false);
      expect(r.reason).toContain("invalid format");
    });

    it("returns valid when both keys present and correct format", () => {
      setEnv(SECRET, "sk_test_xxx");
      setEnv(WEBHOOK, "whsec_xxx");
      const r = getStripeBillingConfig();
      expect(r.valid).toBe(true);
      expect(r.config).not.toBeNull();
      expect(r.config?.secretKey).toBe("sk_test_xxx");
      expect(r.config?.webhookSecret).toBe("whsec_xxx");
    });
  });

  describe("isStripeBillingConfigured", () => {
    it("returns false when flag off", () => {
      setEnv(SECRET, "sk_test_xxx");
      setEnv(WEBHOOK, "whsec_xxx");
      expect(isStripeBillingConfigured()).toBe(false);
    });

    it("returns false when flag on but config invalid", () => {
      setEnv(FLAG, "true");
      expect(isStripeBillingConfigured()).toBe(false);
    });

    it("returns true when flag on and config valid", () => {
      setEnv(FLAG, "true");
      setEnv(SECRET, "sk_test_xxx");
      setEnv(WEBHOOK, "whsec_xxx");
      expect(isStripeBillingConfigured()).toBe(true);
    });
  });

  describe("getBillingProviderRuntimeConfig", () => {
    it("returns sandbox when flag off", () => {
      setEnv(SECRET, "sk_test_xxx");
      setEnv(WEBHOOK, "whsec_xxx");
      const r = getBillingProviderRuntimeConfig();
      expect(r.providerKind).toBe("sandbox");
      expect(r.fallbackReason).toContain("not enabled");
      expect(r.liveCheckoutEnabled).toBe(false);
    });

    it("returns sandbox when flag on but config invalid", () => {
      setEnv(FLAG, "true");
      setEnv(SECRET, "");
      const r = getBillingProviderRuntimeConfig();
      expect(r.providerKind).toBe("sandbox");
      expect(r.fallbackReason).not.toBeNull();
      expect(r.liveCheckoutEnabled).toBe(false);
    });

    it("returns stripe when flag on and config valid", () => {
      setEnv(FLAG, "true");
      setEnv(SECRET, "sk_test_xxx");
      setEnv(WEBHOOK, "whsec_xxx");
      const r = getBillingProviderRuntimeConfig();
      expect(r.providerKind).toBe("stripe");
      expect(r.configValid).toBe(true);
      expect(r.fallbackReason).toBeNull();
      expect(r.liveCheckoutEnabled).toBe(false);
    });

    it("returns liveCheckoutEnabled when live flag on", () => {
      setEnv(FLAG, "true");
      setEnv("ENABLE_STRIPE_LIVE_CHECKOUT", "true");
      setEnv(SECRET, "sk_test_xxx");
      setEnv(WEBHOOK, "whsec_xxx");
      const r = getBillingProviderRuntimeConfig();
      expect(r.liveCheckoutEnabled).toBe(true);
    });

    it("returns webhookIngressEnabled when webhook flag on", () => {
      setEnv(FLAG, "true");
      setEnv(FLAG_WEBHOOK, "true");
      setEnv(SECRET, "sk_test_xxx");
      setEnv(WEBHOOK, "whsec_xxx");
      const r = getBillingProviderRuntimeConfig();
      expect(r.webhookIngressEnabled).toBe(true);
    });
  });

  describe("getStripeWebhookIngressConfig", () => {
    it("returns not enabled when provider flag off", () => {
      setEnv(SECRET, "sk_test_xxx");
      setEnv(WEBHOOK, "whsec_xxx");
      const c = getStripeWebhookIngressConfig();
      expect(c.enabled).toBe(false);
      expect(c.webhookSecretValid).toBe(false);
    });

    it("returns not enabled when webhook flag off", () => {
      setEnv(FLAG, "true");
      setEnv(SECRET, "sk_test_xxx");
      setEnv(WEBHOOK, "whsec_xxx");
      const c = getStripeWebhookIngressConfig();
      expect(c.enabled).toBe(false);
    });

    it("returns webhookSecretValid false when secret missing", () => {
      setEnv(FLAG, "true");
      setEnv(FLAG_WEBHOOK, "true");
      setEnv(SECRET, "sk_test_xxx");
      deleteEnv(WEBHOOK);
      const c = getStripeWebhookIngressConfig();
      expect(c.enabled).toBe(true);
      expect(c.webhookSecretValid).toBe(false);
    });

    it("returns ready when all flags and config valid", () => {
      setEnv(FLAG, "true");
      setEnv(FLAG_WEBHOOK, "true");
      setEnv(SECRET, "sk_test_xxx");
      setEnv(WEBHOOK, "whsec_xxx");
      const c = getStripeWebhookIngressConfig();
      expect(c.enabled).toBe(true);
      expect(c.webhookSecretValid).toBe(true);
    });
  });
});
