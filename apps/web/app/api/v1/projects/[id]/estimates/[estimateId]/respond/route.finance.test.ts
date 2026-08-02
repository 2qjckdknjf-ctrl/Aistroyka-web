import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import * as estimates from "@/lib/domain/customer-estimates/customer-estimates.service";
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
vi.mock("@/lib/domain/customer-estimates/customer-estimates.service", () => ({
  respondToCustomerEstimate: vi.fn(),
}));

describe("POST /api/v1/projects/:id/estimates/:estimateId/respond finance", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns safe respond payload with commercial fields", async () => {
    vi.mocked(estimates.respondToCustomerEstimate).mockResolvedValue({
      data: { id: "e1", total_amount: 200, currency: "EUR" } as never,
      error: "",
    });
    const req = new Request("https://test/api/v1/projects/p1/estimates/e1/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: "approve" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "p1", estimateId: "e1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.total_amount).toBe(200);
  });

  it("blocks finance leak of margin without leaking key or value", async () => {
    vi.mocked(estimates.respondToCustomerEstimate).mockResolvedValue({
      data: { id: "e1", margin: 1 } as never,
      error: "",
    });
    const req = new Request("https://test/api/v1/projects/p1/estimates/e1/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: "approve" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "p1", estimateId: "e1" }) });
    await expectCustomerFinanceBlocked(res, { forbiddenKey: "margin", injectedValue: 1 });
  });
});
