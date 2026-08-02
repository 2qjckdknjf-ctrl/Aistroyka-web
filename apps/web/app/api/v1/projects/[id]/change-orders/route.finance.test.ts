import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";
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
  listChangeOrders: vi.fn(),
  createChangeOrder: vi.fn(),
}));
vi.mock("@/lib/domain/change-orders/change-orders.policy", () => ({
  canManageChangeOrders: vi.fn(),
}));

describe("GET|POST /api/v1/projects/:id/change-orders finance", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns safe stakeholder list with commercial fields", async () => {
    vi.mocked(policy.canManageChangeOrders).mockResolvedValue(false);
    vi.mocked(changeOrders.listChangeOrders).mockResolvedValue({
      data: [{ id: "c1", title: "X", customer_amount_delta: 20, currency: "EUR" }] as never,
      error: "",
    });
    const res = await GET(new Request("https://test/api/v1/projects/p1/change-orders"), {
      params: Promise.resolve({ id: "p1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data[0].customer_amount_delta).toBe(20);
    expect(body.data[0].currency).toBe("EUR");
  });

  it("blocks stakeholder leak of budget_delta_amount without leaking key or value", async () => {
    vi.mocked(policy.canManageChangeOrders).mockResolvedValue(false);
    vi.mocked(changeOrders.listChangeOrders).mockResolvedValue({
      data: [{ id: "c1", title: "X", budget_delta_amount: 10 }] as never,
      error: "",
    });
    const res = await GET(new Request("https://test/api/v1/projects/p1/change-orders"), {
      params: Promise.resolve({ id: "p1" }),
    });
    await expectCustomerFinanceBlocked(res, { forbiddenKey: "budget_delta_amount", injectedValue: 10 });
  });

  it("preserves manager GET internal budget fields without customer guard", async () => {
    vi.mocked(policy.canManageChangeOrders).mockResolvedValue(true);
    vi.mocked(changeOrders.listChangeOrders).mockResolvedValue({
      data: [{ id: "c1", title: "X", budget_delta_amount: 10, budget_impact_level: "high" }] as never,
      error: "",
    });
    const res = await GET(new Request("https://test/api/v1/projects/p1/change-orders"), {
      params: Promise.resolve({ id: "p1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data[0].budget_delta_amount).toBe(10);
    expect(body.data[0].budget_impact_level).toBe("high");
  });

  it("preserves manager POST create internal finance fields", async () => {
    vi.mocked(changeOrders.createChangeOrder).mockResolvedValue({
      data: {
        id: "c1",
        title: "New",
        budget_delta_amount: 77,
        budget_impact_level: "minor",
        internal_cost_item_id: "ici",
      } as never,
      error: "",
    });
    const req = new Request("https://test/api/v1/projects/p1/change-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "other", title: "New" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.budget_delta_amount).toBe(77);
    expect(body.data.internal_cost_item_id).toBe("ici");
  });
});
