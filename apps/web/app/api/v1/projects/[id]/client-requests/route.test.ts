import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";
import * as policy from "@/lib/domain/client-requests/client-requests.policy";
import * as svc from "@/lib/domain/client-requests/client-requests.service";

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
vi.mock("@/lib/domain/client-requests/client-requests.policy", () => ({
  canManageClientRequests: vi.fn(),
}));
vi.mock("@/lib/domain/client-requests/client-requests.service", () => ({
  listClientRequests: vi.fn(),
  createClientRequest: vi.fn(),
}));

describe("GET/POST /api/v1/projects/:id/client-requests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns manager list when canManageClientRequests", async () => {
    vi.mocked(policy.canManageClientRequests).mockResolvedValue(true);
    vi.mocked(svc.listClientRequests).mockResolvedValue({
      data: [{ id: "r1", title: "T" } as any],
      error: "",
    });
    const req = new Request("https://test/api/v1/projects/p1/client-requests");
    const res = await GET(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data[0].id).toBe("r1");
    expect(svc.listClientRequests).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      "p1",
      expect.objectContaining({ viewer: "manager" })
    );
  });

  it("POST creates when service succeeds", async () => {
    vi.mocked(svc.createClientRequest).mockResolvedValue({
      data: { id: "r1", title: "Hello" } as any,
      error: "",
    });
    const req = new Request("https://test/api/v1/projects/p1/client-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "feedback", title: "Hello" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(200);
  });
});
