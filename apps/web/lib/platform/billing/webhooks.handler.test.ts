import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleCheckoutCompleted, handleSubscriptionUpdated } from "./webhooks.handler";
import { upsertEntitlements } from "./entitlements.service";

vi.mock("./entitlements.service", () => ({
  upsertEntitlements: vi.fn(async () => ({ error: null })),
}));

function makeSupabase(opts: {
  tenantId: string | null;
  billingUpsertError?: { message: string } | null;
}) {
  const upsert = vi.fn(async () => ({ error: opts.billingUpsertError ?? null }));
  const maybeSingle = vi.fn(async () => ({
    data: opts.tenantId ? { tenant_id: opts.tenantId } : null,
    error: null,
  }));
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select, upsert }));
  return { from, upsert };
}

describe("handleSubscriptionUpdated error propagation", () => {
  beforeEach(() => {
    vi.mocked(upsertEntitlements).mockReset();
    vi.mocked(upsertEntitlements).mockResolvedValue({ error: null });
  });

  it("throws when billing_customers upsert fails", async () => {
    const sb = makeSupabase({
      tenantId: "tenant-1",
      billingUpsertError: { message: "upsert failed" },
    });
    await expect(
      handleSubscriptionUpdated(sb as never, {
        id: "sub_1",
        customer: "cus_1",
        status: "active",
        items: { data: [{ price: { id: "price_pro" } }] },
      })
    ).rejects.toThrow(/upsert failed/);
    expect(upsertEntitlements).not.toHaveBeenCalled();
  });

  it("throws when entitlements upsert fails", async () => {
    const sb = makeSupabase({ tenantId: "tenant-1" });
    vi.mocked(upsertEntitlements).mockResolvedValue({ error: "entitlements down" });
    await expect(
      handleSubscriptionUpdated(sb as never, {
        id: "sub_1",
        customer: "cus_1",
        status: "active",
        items: { data: [{ price: { id: "price_pro" } }] },
      })
    ).rejects.toThrow(/entitlements down/);
  });

  it("upserts paid tier when subscription is active", async () => {
    const sb = makeSupabase({ tenantId: "tenant-1" });
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
});

describe("handleCheckoutCompleted error propagation", () => {
  it("throws when billing_customers upsert fails", async () => {
    const sb = makeSupabase({
      tenantId: "tenant-1",
      billingUpsertError: { message: "checkout upsert failed" },
    });
    await expect(
      handleCheckoutCompleted(sb as never, {
        id: "cs_1",
        customer: "cus_1",
        client_reference_id: "tenant-1",
      })
    ).rejects.toThrow(/checkout upsert failed/);
  });
});
