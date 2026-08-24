import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  entitlementTierForSubscription,
  handleSubscriptionDeleted,
  handleSubscriptionUpdated,
  planToTier,
} from "./webhooks.handler";
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

describe("planToTier / entitlementTierForSubscription", () => {
  it("maps price ids to tiers", () => {
    expect(planToTier("price_pro_monthly")).toBe("PRO");
    expect(planToTier("price_enterprise_annual")).toBe("ENTERPRISE");
    expect(planToTier("price_basic")).toBe("FREE");
  });

  it("only grants paid entitlements for active/trialing", () => {
    expect(entitlementTierForSubscription("active", "price_pro")).toBe("PRO");
    expect(entitlementTierForSubscription("trialing", "price_enterprise")).toBe("ENTERPRISE");
    expect(entitlementTierForSubscription("canceled", "price_pro")).toBe("FREE");
    expect(entitlementTierForSubscription("past_due", "price_pro")).toBe("FREE");
    expect(entitlementTierForSubscription("unpaid", "price_pro")).toBe("FREE");
    expect(entitlementTierForSubscription("incomplete", "price_pro")).toBe("FREE");
  });
});

describe("handleSubscriptionUpdated", () => {
  beforeEach(() => {
    vi.mocked(upsertEntitlements).mockClear();
  });

  it("upserts paid tier when subscription is active", async () => {
    const sb = makeSupabase("tenant-1");
    await handleSubscriptionUpdated(sb as never, {
      id: "sub_1",
      customer: "cus_1",
      status: "active",
      items: { data: [{ price: { id: "price_pro_monthly" } }] },
      current_period_start: 1_700_000_000,
      current_period_end: 1_700_086_400,
    });
    expect(sb.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: "tenant-1",
        status: "active",
        plan: "price_pro_monthly",
      }),
      { onConflict: "tenant_id" }
    );
    expect(upsertEntitlements).toHaveBeenCalledWith(sb, { tenant_id: "tenant-1", tier: "PRO" });
  });

  it("revokes paid entitlements when subscription becomes canceled", async () => {
    const sb = makeSupabase("tenant-1");
    await handleSubscriptionUpdated(sb as never, {
      id: "sub_1",
      customer: "cus_1",
      status: "canceled",
      items: { data: [{ price: { id: "price_pro_monthly" } }] },
    });
    expect(sb.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ status: "canceled" }),
      { onConflict: "tenant_id" }
    );
    expect(upsertEntitlements).toHaveBeenCalledWith(sb, { tenant_id: "tenant-1", tier: "FREE" });
  });

  it("no-ops when stripe customer is unknown", async () => {
    const sb = makeSupabase(null);
    await handleSubscriptionUpdated(sb as never, {
      id: "sub_1",
      customer: "cus_missing",
      status: "active",
      items: { data: [{ price: { id: "price_pro" } }] },
    });
    expect(sb.upsert).not.toHaveBeenCalled();
    expect(upsertEntitlements).not.toHaveBeenCalled();
  });
});

describe("handleSubscriptionDeleted", () => {
  beforeEach(() => {
    vi.mocked(upsertEntitlements).mockClear();
  });

  it("marks canceled and downgrades entitlements to FREE", async () => {
    const sb = makeSupabase("tenant-9");
    await handleSubscriptionDeleted(sb as never, {
      id: "sub_gone",
      customer: "cus_9",
      items: { data: [{ price: { id: "price_enterprise" } }] },
    });
    expect(sb.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: "tenant-9",
        stripe_subscription_id: "sub_gone",
        status: "canceled",
      }),
      { onConflict: "tenant_id" }
    );
    expect(upsertEntitlements).toHaveBeenCalledWith(sb, { tenant_id: "tenant-9", tier: "FREE" });
  });
});
