import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import * as changeOrders from "@/lib/domain/change-orders/change-orders.service";

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
}));

describe("GET /api/v1/portal/projects/:id/change-orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 500 when payload contains forbidden finance keys", async () => {
    vi.mocked(changeOrders.listChangeOrders).mockResolvedValue({
      data: [{ id: "c1", title: "Extra work", internal_cost_item_id: "int-1" }] as never,
      error: "",
    });

    const res = await GET(new Request("https://test/api/v1/portal/projects/p1/change-orders"), {
      params: Promise.resolve({ id: "p1" }),
    });

    expect(res.status).toBe(500);
  });

  it("returns 200 for safe payload", async () => {
    vi.mocked(changeOrders.listChangeOrders).mockResolvedValue({
      data: [{ id: "c1", title: "Extra work", customer_amount_delta: 500 }] as never,
      error: "",
    });

    const res = await GET(new Request("https://test/api/v1/portal/projects/p1/change-orders"), {
      params: Promise.resolve({ id: "p1" }),
    });

    expect(res.status).toBe(200);
  });
});
