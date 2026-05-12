import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";
import * as clientRequests from "@/lib/domain/client-requests/client-requests.service";

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn().mockResolvedValue({
    tenantId: "t1",
    userId: "u1",
    role: "owner",
    subscriptionTier: "free",
    clientProfile: "web",
    traceId: "trace1",
  }),
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {},
  TenantForbiddenError: class TenantForbiddenError extends Error {},
}));

vi.mock("@/lib/domain/client-requests/client-requests.service", () => ({
  createClientRequest: vi.fn(),
  listClientRequests: vi.fn(),
}));

describe("Phase 3 /api/v1/projects/:id/decision-requests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists manager decision requests", async () => {
    vi.mocked(clientRequests.listClientRequests).mockResolvedValue({ data: [], error: "" });
    const res = await GET(new Request("https://test/api/v1/projects/p1/decision-requests"), {
      params: Promise.resolve({ id: "p1" }),
    });
    expect(res.status).toBe(200);
    expect(clientRequests.listClientRequests).toHaveBeenCalledWith(expect.anything(), expect.anything(), "p1", {
      viewer: "manager",
      status: "all",
    });
  });

  it("creates a decision request from canonical decision type", async () => {
    vi.mocked(clientRequests.createClientRequest).mockResolvedValue({
      data: { id: "r1", title: "Approve estimate" } as never,
      error: "",
    });
    const req = new Request("https://test/api/v1/projects/p1/decision-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "estimate_approval",
        title: "Approve estimate",
        description: "Customer-facing estimate approval.",
        customer_visible_amount: 1000,
        customer_visible_currency: "RUB",
      }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(200);
    expect(clientRequests.createClientRequest).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      "p1",
      expect.objectContaining({
        kind: "approve_or_reject",
        decision_type: "estimate_approval",
        customer_visible_amount: 1000,
      })
    );
  });
});
