import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";
import * as costService from "@/lib/domain/costs/cost.service";

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn().mockResolvedValue({
    tenantId: "t1",
    userId: "stakeholder-user",
    role: "stakeholder",
  }),
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {},
}));

vi.mock("@/lib/domain/costs/cost.service", () => ({
  listCostItems: vi.fn(),
  getBudgetSummary: vi.fn(),
  createCostItem: vi.fn(),
}));

describe("/api/v1/projects/:id/costs — owner/stakeholder cannot read internal costs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 403 when listCostItems denies (portal-only / stakeholder)", async () => {
    vi.mocked(costService.listCostItems).mockResolvedValue({
      data: [],
      error: "Insufficient rights",
    });
    vi.mocked(costService.getBudgetSummary).mockResolvedValue({
      data: null,
      error: "",
    });

    const res = await GET(new Request("https://test/api/v1/projects/p1/costs"), {
      params: Promise.resolve({ id: "p1" }),
    });
    expect(res.status).toBe(403);
  });

  it("POST returns 403 when createCostItem denies (portal-only / stakeholder)", async () => {
    vi.mocked(costService.createCostItem).mockResolvedValue({
      data: null,
      error: "Insufficient rights",
    });

    const res = await POST(
      new Request("https://test/api/v1/projects/p1/costs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Line",
          planned_amount: 100,
        }),
      }),
      { params: Promise.resolve({ id: "p1" }) }
    );
    expect(res.status).toBe(403);
  });
});
