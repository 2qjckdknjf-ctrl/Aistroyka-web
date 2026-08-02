import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import * as clientRequests from "@/lib/domain/client-requests/client-requests.service";
import { expectCustomerFinanceBlocked } from "@/tests/helpers/customer-finance-route-assertions";

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/lib/supabase/admin", () => ({ getAdminClient: vi.fn().mockReturnValue(null) }));
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
  respondToClientRequest: vi.fn(),
}));
vi.mock("@/lib/domain/notifications/manager-notifications.repository", () => ({
  notifyProjectManagers: vi.fn(),
}));

describe("POST /api/v1/projects/:id/client-requests/:requestId/respond finance", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns safe respond payload", async () => {
    vi.mocked(clientRequests.respondToClientRequest).mockResolvedValue({
      data: { id: "r1", title: "X" } as never,
      error: "",
    });
    const req = new Request("https://test/api/v1/projects/p1/client-requests/r1/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: "approve" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "p1", requestId: "r1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.title).toBe("X");
  });

  it("blocks finance leak of ai_finance_risk without leaking key or value", async () => {
    vi.mocked(clientRequests.respondToClientRequest).mockResolvedValue({
      data: { id: "r1", title: "X", ai_finance_risk: "high" } as never,
      error: "",
    });
    const req = new Request("https://test/api/v1/projects/p1/client-requests/r1/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: "approve" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "p1", requestId: "r1" }) });
    await expectCustomerFinanceBlocked(res, { forbiddenKey: "ai_finance_risk", injectedValue: "high" });
  });
});
