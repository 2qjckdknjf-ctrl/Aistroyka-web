import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleSubscriptionUpdated, planToTier } from "./webhooks.handler";
import { upsertEntitlements } from "./entitlements.service";

vi.mock("./entitlements.service", () => ({
  upsertEntitlements: vi.fn(async () => ({ error: null })),
}));

function makeSupabase(tenantId: string | null) {
  const upsert = vi.fn(async () => ({ error: null }));
  const maybeSingle = vi.fn(async () => ({
    data: tenantId ? { tenant_id: tenantId } : null,
    error: null,
  }));
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn((table: string) => {
    if (table === "billing_customers") {
      return { select, upsert };
    }
    return { select, upsert };
  });
  return { from, upsert, maybeSingle };
}

describe("planToTier", () => {
  afterEach(() => {
    delete process.env.STRIPE_PRICE_STARTER;
    delete process.env.STRIPE_PRICE_BUSINESS;
    delete process.env.STRIPE_PRICE_ENTERPRISE;
    delete process.env.STRIPE_PRICE_ID;
  });

  it("maps opaque configured Stripe price ids from checkout env vars", () => {
    process.env.STRIPE_PRICE_STARTER = "price_1StarterOpaque";
    process.env.STRIPE_PRICE_BUSINESS = "price_1BusinessOpaque";
    process.env.STRIPE_PRICE_ENTERPRISE = "price_1EnterpriseOpaque";
    process.env.STRIPE_PRICE_ID = "price_1LegacyOpaque";

    expect(planToTier("price_1StarterOpaque")).toBe("PRO");
    expect(planToTier("price_1BusinessOpaque")).toBe("PRO");
    expect(planToTier("price_1EnterpriseOpaque")).toBe("ENTERPRISE");
    expect(planToTier("price_1LegacyOpaque")).toBe("PRO");
  });

  it("keeps named/test price substring heuristics", () => {
    expect(planToTier("price_pro_monthly")).toBe("PRO");
    expect(planToTier("price_business_annual")).toBe("PRO");
    expect(planToTier("price_enterprise_annual")).toBe("ENTERPRISE");
    expect(planToTier("price_basic")).toBe("FREE");
  });

  it("does not treat unconfigured opaque Stripe ids as paid", () => {
    expect(planToTier("price_1UnmappedAbc123")).toBe("FREE");
  });
});

describe("handleSubscriptionUpdated", () => {
  beforeEach(() => {
    vi.mocked(upsertEntitlements).mockClear();
    process.env.STRIPE_PRICE_BUSINESS = "price_1BusinessOpaque";
  });

  afterEach(() => {
    delete process.env.STRIPE_PRICE_BUSINESS;
  });

  it("upserts PRO entitlements for configured business price id", async () => {
    const sb = makeSupabase("tenant-1");
    await handleSubscriptionUpdated(sb as never, {
      id: "sub_1",
      customer: "cus_1",
      status: "active",
      items: { data: [{ price: { id: "price_1BusinessOpaque" } }] },
      current_period_start: 1_700_000_000,
      current_period_end: 1_700_086_400,
    });
    expect(upsertEntitlements).toHaveBeenCalledWith(sb, {
      tenant_id: "tenant-1",
      tier: "PRO",
    });
  });
});
