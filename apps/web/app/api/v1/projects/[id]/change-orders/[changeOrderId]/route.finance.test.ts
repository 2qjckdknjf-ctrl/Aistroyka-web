import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, PATCH } from "./route";
import * as changeOrders from "@/lib/domain/change-orders/change-orders.service";
import * as policy from "@/lib/domain/change-orders/change-orders.policy";
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
  getChangeOrderDetail: vi.fn(),
  updateChangeOrderContent: vi.fn(),
}));
vi.mock("@/lib/domain/change-orders/change-orders.policy", () => ({
  canManageChangeOrders: vi.fn(),
}));

describe("GET|PATCH /api/v1/projects/:id/change-orders/:changeOrderId finance", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns safe stakeholder detail with commercial fields", async () => {
    vi.mocked(policy.canManageChangeOrders).mockResolvedValue(false);
    vi.mocked(changeOrders.getChangeOrderDetail).mockResolvedValue({
      data: { id: "c1", customer_amount_delta: 5, currency: "EUR", schedule_delta_days: 1 } as never,
      error: "",
    });
    const res = await GET(new Request("https://test/api/v1/projects/p1/change-orders/c1"), {
      params: Promise.resolve({ id: "p1", changeOrderId: "c1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.audience).toBe("stakeholder");
    expect(body.data.customer_amount_delta).toBe(5);
  });

  it("blocks stakeholder leak of budget_impact_level without leaking key or value", async () => {
    vi.mocked(policy.canManageChangeOrders).mockResolvedValue(false);
    vi.mocked(changeOrders.getChangeOrderDetail).mockResolvedValue({
      data: { id: "c1", budget_impact_level: "high" } as never,
      error: "",
    });
    const res = await GET(new Request("https://test/api/v1/projects/p1/change-orders/c1"), {
      params: Promise.resolve({ id: "p1", changeOrderId: "c1" }),
    });
    await expectCustomerFinanceBlocked(res, { forbiddenKey: "budget_impact_level", injectedValue: "high" });
  });

  it("preserves manager GET internal finance fields without customer guard", async () => {
    vi.mocked(policy.canManageChangeOrders).mockResolvedValue(true);
    vi.mocked(changeOrders.getChangeOrderDetail).mockResolvedValue({
      data: { id: "c1", budget_impact_level: "high", budget_delta_amount: 9 } as never,
      error: "",
    });
    const res = await GET(new Request("https://test/api/v1/projects/p1/change-orders/c1"), {
      params: Promise.resolve({ id: "p1", changeOrderId: "c1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.audience).toBe("manager");
    expect(body.data.budget_delta_amount).toBe(9);
    expect(body.data.budget_impact_level).toBe("high");
  });

  it("preserves manager PATCH ok:true exact contract", async () => {
    vi.mocked(changeOrders.updateChangeOrderContent).mockResolvedValue({ ok: true, error: "" });
    const req = new Request("https://test/api/v1/projects/p1/change-orders/c1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated" }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "p1", changeOrderId: "c1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
    expect(Object.keys(body)).toEqual(["ok"]);
  });
});
