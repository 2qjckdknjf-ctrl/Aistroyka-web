import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import * as changeOrders from "@/lib/domain/change-orders/change-orders.service";
import { expectCustomerFinanceBlocked } from "@/tests/helpers/customer-finance-route-assertions";

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn().mockResolvedValue({
    tenantId: "t1",
    userId: "u1",
    role: "admin",
    subscriptionTier: "free",
    clientProfile: "web",
    traceId: "trace1",
  }),
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {},
  TenantForbiddenError: class TenantForbiddenError extends Error {},
}));
vi.mock("@/lib/domain/change-orders/change-orders.service", () => ({
  getChangeOrderDetail: vi.fn(),
}));

describe("GET /api/v1/portal/projects/:id/change-orders/:changeOrderId", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns safe public detail with commercial fields", async () => {
    vi.mocked(changeOrders.getChangeOrderDetail).mockResolvedValue({
      data: {
        id: "c1",
        title: "Extra work",
        customer_amount_delta: 200,
        currency: "EUR",
        schedule_delta_days: 1,
      } as never,
      error: "",
    });
    const res = await GET(new Request("https://test/api/v1/portal/projects/p1/change-orders/c1"), {
      params: Promise.resolve({ id: "p1", changeOrderId: "c1" }),
    });
    expect(changeOrders.getChangeOrderDetail).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      "p1",
      "c1",
      { forcePublic: true }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.audience).toBe("stakeholder");
    expect(body.data.customer_amount_delta).toBe(200);
    expect(body.data.currency).toBe("EUR");
    expect(body.data.schedule_delta_days).toBe(1);
  });

  it("blocks finance leak of budget_delta_amount without leaking key or value", async () => {
    vi.mocked(changeOrders.getChangeOrderDetail).mockResolvedValue({
      data: {
        id: "c1",
        title: "Extra work",
        budget_delta_amount: 1500,
        budget_impact_level: "high",
        internal_cost_item_id: "ici-1",
      } as never,
      error: "",
    });
    const res = await GET(new Request("https://test/api/v1/portal/projects/p1/change-orders/c1"), {
      params: Promise.resolve({ id: "p1", changeOrderId: "c1" }),
    });
    await expectCustomerFinanceBlocked(res, { forbiddenKey: "budget_delta_amount", injectedValue: 1500 });
  });
});
