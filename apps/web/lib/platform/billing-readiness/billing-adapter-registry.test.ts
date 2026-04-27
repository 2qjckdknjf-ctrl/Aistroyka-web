import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { getBillingAdapterDiagnostics } from "./billing-adapter-registry";

const FLAG_PROVIDER = "ENABLE_STRIPE_BILLING_PROVIDER";
const FLAG_LIVE = "ENABLE_STRIPE_LIVE_CHECKOUT";
const FLAG_WEBHOOK = "ENABLE_STRIPE_WEBHOOK_INGRESS";
const SECRET = "STRIPE_SECRET_KEY";
const WEBHOOK = "STRIPE_WEBHOOK_SECRET";

function setEnv(key: string, value: string) {
  process.env[key] = value;
}
function deleteEnv(key: string) {
  delete process.env[key];
}

describe("billing-adapter-registry (Step 16 diagnostics)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    deleteEnv(FLAG_PROVIDER);
    deleteEnv(FLAG_LIVE);
    deleteEnv(FLAG_WEBHOOK);
    deleteEnv(SECRET);
    deleteEnv(WEBHOOK);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("getBillingAdapterDiagnostics checkout mode matrix", () => {
    it("provider flag off -> checkoutMode sandbox", () => {
      setEnv(SECRET, "sk_test_xxx");
      setEnv(WEBHOOK, "whsec_xxx");
      const diag = getBillingAdapterDiagnostics();
      expect(diag.checkoutMode).toBe("sandbox");
      expect(diag.liveCheckoutEnabled).toBe(false);
      expect(diag.providerKind).toBe("sandbox");
    });

    it("provider flag on + live off + valid config -> checkoutMode provider_stub", () => {
      setEnv(FLAG_PROVIDER, "true");
      setEnv(SECRET, "sk_test_xxx");
      setEnv(WEBHOOK, "whsec_xxx");
      const diag = getBillingAdapterDiagnostics();
      expect(diag.checkoutMode).toBe("provider_stub");
      expect(diag.liveCheckoutEnabled).toBe(false);
      expect(diag.providerKind).toBe("stripe");
    });

    it("provider flag on + live on + valid config -> checkoutMode provider_live", () => {
      setEnv(FLAG_PROVIDER, "true");
      setEnv(FLAG_LIVE, "true");
      setEnv(SECRET, "sk_test_xxx");
      setEnv(WEBHOOK, "whsec_xxx");
      const diag = getBillingAdapterDiagnostics();
      expect(diag.checkoutMode).toBe("provider_live");
      expect(diag.liveCheckoutEnabled).toBe(true);
      expect(diag.providerKind).toBe("stripe");
    });

    it("provider flag on + config invalid -> checkoutMode sandbox (fallback)", () => {
      setEnv(FLAG_PROVIDER, "true");
      setEnv(FLAG_LIVE, "true");
      setEnv(SECRET, "");
      const diag = getBillingAdapterDiagnostics();
      expect(diag.checkoutMode).toBe("sandbox");
      expect(diag.providerKind).toBe("sandbox");
    });

    it("includes webhookIngressEnabled and webhookConfigValid in diagnostics (Step 17)", () => {
      setEnv(FLAG_PROVIDER, "true");
      setEnv(FLAG_WEBHOOK, "true");
      setEnv(SECRET, "sk_test_xxx");
      setEnv(WEBHOOK, "whsec_xxx");
      const diag = getBillingAdapterDiagnostics();
      expect(diag.webhookIngressEnabled).toBe(true);
      expect(diag.webhookConfigValid).toBe(true);
    });
  });
});
