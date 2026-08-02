import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, PATCH } from "./route";
import * as clientRequests from "@/lib/domain/client-requests/client-requests.service";
import * as policy from "@/lib/domain/client-requests/client-requests.policy";
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
vi.mock("@/lib/domain/client-requests/client-requests.policy", () => ({
  canManageClientRequests: vi.fn(),
}));
vi.mock("@/lib/domain/client-requests/client-requests.service", () => ({
  getClientRequest: vi.fn(),
  patchClientRequestByManager: vi.fn(),
}));

describe("GET|PATCH /api/v1/projects/:id/client-requests/:requestId finance", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns safe stakeholder detail", async () => {
    vi.mocked(policy.canManageClientRequests).mockResolvedValue(false);
    vi.mocked(clientRequests.getClientRequest).mockResolvedValue({
      data: { id: "r1", title: "Decide" } as never,
      error: "",
    });
    const res = await GET(new Request("https://test/api/v1/projects/p1/client-requests/r1"), {
      params: Promise.resolve({ id: "p1", requestId: "r1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.title).toBe("Decide");
  });

  it("blocks stakeholder leak of subcontractor_cost without leaking key or value", async () => {
    vi.mocked(policy.canManageClientRequests).mockResolvedValue(false);
    vi.mocked(clientRequests.getClientRequest).mockResolvedValue({
      data: { id: "r1", subcontractor_cost: 40 } as never,
      error: "",
    });
    const res = await GET(new Request("https://test/api/v1/projects/p1/client-requests/r1"), {
      params: Promise.resolve({ id: "p1", requestId: "r1" }),
    });
    await expectCustomerFinanceBlocked(res, { forbiddenKey: "subcontractor_cost", injectedValue: 40 });
  });

  it("preserves manager GET internal finance fields without customer guard", async () => {
    vi.mocked(policy.canManageClientRequests).mockResolvedValue(true);
    vi.mocked(clientRequests.getClientRequest).mockResolvedValue({
      data: { id: "r1", subcontractor_cost: 40, margin: 3 } as never,
      error: "",
    });
    const res = await GET(new Request("https://test/api/v1/projects/p1/client-requests/r1"), {
      params: Promise.resolve({ id: "p1", requestId: "r1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.subcontractor_cost).toBe(40);
    expect(body.data.margin).toBe(3);
  });

  it("preserves manager PATCH response payload", async () => {
    vi.mocked(clientRequests.patchClientRequestByManager).mockResolvedValue({
      data: { id: "r1", status: "completed", margin: 2 } as never,
      error: "",
    });
    const req = new Request("https://test/api/v1/projects/p1/client-requests/r1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "p1", requestId: "r1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe("completed");
    expect(body.data.margin).toBe(2);
  });
});
