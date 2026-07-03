import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/platform-owner/require-platform-owner-api", () => ({
  requirePlatformOwnerApi: vi.fn().mockResolvedValue({ ok: true, supabase: {}, userId: "u1", role: "OWNER" }),
}));

const FLAG_PROVIDER = "ENABLE_STRIPE_BILLING_PROVIDER";
const FLAG_LIVE = "ENABLE_STRIPE_LIVE_CHECKOUT";
const SECRET = "STRIPE_SECRET_KEY";
const WEBHOOK = "STRIPE_WEBHOOK_SECRET";

function setEnv(key: string, value: string) {
  process.env[key] = value;
}
function deleteEnv(key: string) {
  delete process.env[key];
}

describe("GET /api/v1/admin/billing/provider-status", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    deleteEnv(FLAG_PROVIDER);
    deleteEnv(FLAG_LIVE);
    deleteEnv(SECRET);
    deleteEnv(WEBHOOK);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns provider diagnostics", async () => {
    const { GET } = await import("./route");
    const req = new Request("https://x/api/v1/admin/billing/provider-status");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("activeAdapterKind");
    expect(body).toHaveProperty("providerKind");
    expect(body).toHaveProperty("providerEnabled");
    expect(body).toHaveProperty("configValid");
    expect(body).toHaveProperty("flagEnabled");
    expect(body).toHaveProperty("sandboxFallbackActive");
    expect(body).toHaveProperty("liveCheckoutEnabled");
    expect(body).toHaveProperty("checkoutMode");
    expect(["sandbox", "stripe"]).toContain(body.activeAdapterKind);
    expect(["sandbox", "provider_stub", "provider_live"]).toContain(body.checkoutMode);
  });

  describe("Step 16 mode reflection", () => {
    it("provider off -> sandbox mode reported", async () => {
      setEnv(SECRET, "sk_test_xxx");
      setEnv(WEBHOOK, "whsec_xxx");
      const { GET } = await import("./route");
      const res = await GET(new Request("https://x/api/v1/admin/billing/provider-status"));
      const body = await res.json();
      expect(body.checkoutMode).toBe("sandbox");
      expect(body.liveCheckoutEnabled).toBe(false);
    });

    it("provider on + live off -> provider_stub reported", async () => {
      setEnv(FLAG_PROVIDER, "true");
      setEnv(SECRET, "sk_test_xxx");
      setEnv(WEBHOOK, "whsec_xxx");
      const { GET } = await import("./route");
      const res = await GET(new Request("https://x/api/v1/admin/billing/provider-status"));
      const body = await res.json();
      expect(body.checkoutMode).toBe("provider_stub");
      expect(body.liveCheckoutEnabled).toBe(false);
    });

    it("provider on + live on + valid config -> provider_live reported", async () => {
      setEnv(FLAG_PROVIDER, "true");
      setEnv(FLAG_LIVE, "true");
      setEnv(SECRET, "sk_test_xxx");
      setEnv(WEBHOOK, "whsec_xxx");
      const { GET } = await import("./route");
      const res = await GET(new Request("https://x/api/v1/admin/billing/provider-status"));
      const body = await res.json();
      expect(body.checkoutMode).toBe("provider_live");
      expect(body.liveCheckoutEnabled).toBe(true);
    });
  });
});
