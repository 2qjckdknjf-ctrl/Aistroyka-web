import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import * as clientRequests from "@/lib/domain/client-requests/client-requests.service";
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
vi.mock("@/lib/domain/client-requests/client-requests.service", () => ({
  listClientRequests: vi.fn(),
}));

describe("GET /api/v1/projects/:id/decisions finance", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns safe decisions list", async () => {
    vi.mocked(clientRequests.listClientRequests).mockResolvedValue({
      data: [{ id: "r1", title: "Approve facade" }] as never,
      error: "",
    });
    const res = await GET(new Request("https://test/api/v1/projects/p1/decisions"), {
      params: Promise.resolve({ id: "p1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data[0].title).toBe("Approve facade");
  });

  it("blocks finance leak of project_cost_items without leaking key or value", async () => {
    vi.mocked(clientRequests.listClientRequests).mockResolvedValue({
      data: [{ id: "r1", project_cost_items: [{ id: "ci1" }] }] as never,
      error: "",
    });
    const res = await GET(new Request("https://test/api/v1/projects/p1/decisions"), {
      params: Promise.resolve({ id: "p1" }),
    });
    await expectCustomerFinanceBlocked(res, { forbiddenKey: "project_cost_items", injectedValue: "ci1" });
  });
});
