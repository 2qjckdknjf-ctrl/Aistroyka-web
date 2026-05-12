import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import * as clientRequests from "@/lib/domain/client-requests/client-requests.service";

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn().mockReturnValue(null),
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
  respondToClientRequest: vi.fn(),
}));

describe("POST /api/v1/portal/projects/:id/decisions/:requestId/respond", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delegates to respondToClientRequest", async () => {
    vi.mocked(clientRequests.respondToClientRequest).mockResolvedValue({
      data: { title: "Approve layout" } as never,
      error: "",
    });
    const req = new Request("https://test/api/v1/portal/projects/p1/decisions/r1/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: "approve" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "p1", requestId: "r1" }) });
    expect(res.status).toBe(200);
    expect(clientRequests.respondToClientRequest).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      "p1",
      "r1",
      expect.objectContaining({ decision: "approve" })
    );
  });
});
