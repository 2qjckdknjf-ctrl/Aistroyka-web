import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import * as changeOrders from "@/lib/domain/change-orders/change-orders.service";
import { expectCustomerFinanceBlocked } from "@/tests/helpers/customer-finance-route-assertions";

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn().mockResolvedValue({
    tenantId: "t1",
    userId: "u1",
    role: "stakeholder",
    subscriptionTier: "free",
    clientProfile: "web",
    traceId: "trace1",
  }),
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {},
  TenantForbiddenError: class TenantForbiddenError extends Error {},
}));
vi.mock("@/lib/domain/change-orders/change-orders.service", () => ({
  respondToChangeOrderByCustomer: vi.fn(),
}));

describe("POST /api/v1/projects/:id/change-orders/:changeOrderId/respond finance", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns safe respond payload with commercial fields", async () => {
    vi.mocked(changeOrders.respondToChangeOrderByCustomer).mockResolvedValue({
      data: { id: "c1", customer_amount_delta: 11, currency: "EUR" } as never,
      error: "",
    });
    const req = new Request("https://test/api/v1/projects/p1/change-orders/c1/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: "approve" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "p1", changeOrderId: "c1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.customer_amount_delta).toBe(11);
  });

  it("blocks finance leak of planned_amount without leaking key or value", async () => {
    vi.mocked(changeOrders.respondToChangeOrderByCustomer).mockResolvedValue({
      data: { id: "c1", planned_amount: 100 } as never,
      error: "",
    });
    const req = new Request("https://test/api/v1/projects/p1/change-orders/c1/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: "approve" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "p1", changeOrderId: "c1" }) });
    await expectCustomerFinanceBlocked(res, { forbiddenKey: "planned_amount", injectedValue: 100 });
  });
});
