import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { POST } from "./route";
import * as changeOrders from "@/lib/domain/change-orders/change-orders.service";
import { enforceCustomerFinanceOnJsonResponse } from "@/lib/security/customer-finance-response";
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

describe("POST /api/v1/portal/projects/:id/change-orders/:changeOrderId/respond", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns safe respond payload with commercial fields", async () => {
    vi.mocked(changeOrders.respondToChangeOrderByCustomer).mockResolvedValue({
      data: {
        id: "c1",
        title: "Extra",
        customer_amount_delta: 50,
        currency: "EUR",
        schedule_delta_days: 2,
      } as never,
      error: "",
    });
    const req = new Request("https://test/api/v1/portal/projects/p1/change-orders/c1/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: "approve" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "p1", changeOrderId: "c1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.customer_amount_delta).toBe(50);
    expect(body.data.currency).toBe("EUR");
  });

  it("blocks finance leak of budget_delta_amount without leaking key or value", async () => {
    vi.mocked(changeOrders.respondToChangeOrderByCustomer).mockResolvedValue({
      data: { id: "c1", budget_delta_amount: 50 } as never,
      error: "",
    });
    const req = new Request("https://test/api/v1/portal/projects/p1/change-orders/c1/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: "approve" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "p1", changeOrderId: "c1" }) });
    await expectCustomerFinanceBlocked(res, { forbiddenKey: "budget_delta_amount", injectedValue: 50 });
  });

  it("alias wrapper preserves safe 200 headers and status via enforce helper", async () => {
    const payload = { data: { id: "c1", customer_amount_delta: 10 } };
    const upstream = NextResponse.json(payload, { status: 200 });
    upstream.headers.set("x-portal-alias", "co-respond");
    const out = await enforceCustomerFinanceOnJsonResponse(
      "POST /api/v1/portal/projects/:id/change-orders/:changeOrderId/respond",
      upstream
    );
    expect(out).toBe(upstream);
    expect(out.status).toBe(200);
    expect(out.headers.get("x-portal-alias")).toBe("co-respond");
    expect(await out.json()).toEqual(payload);
  });
});
