import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET } from "./route";
import * as clientPortalService from "@/lib/domain/client-portal/client-portal.service";
import * as tenant from "@/lib/tenant";

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn().mockResolvedValue({
    tenantId: "t1",
    userId: "u1",
    role: "member",
    subscriptionTier: "free",
    clientProfile: "web",
    traceId: "trace1",
  }),
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {},
  TenantForbiddenError: class TenantForbiddenError extends Error {},
}));
vi.mock("@/lib/domain/client-portal/client-portal.service", () => ({
  getClientProjectView: vi.fn(),
}));

describe("GET /api/v1/projects/:id/client-view", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 when service reports insufficient rights", async () => {
    vi.mocked(clientPortalService.getClientProjectView).mockResolvedValue({
      data: null,
      error: "Insufficient rights",
    });
    const req = new Request("https://test/api/v1/projects/p1/client-view");
    const res = await GET(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(403);
  });

  it("returns 404 when portal disabled", async () => {
    vi.mocked(clientPortalService.getClientProjectView).mockResolvedValue({
      data: null,
      error: "Client portal is not enabled",
    });
    const req = new Request("https://test/api/v1/projects/p1/client-view");
    const res = await GET(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(404);
  });

  it("returns shaped data on success", async () => {
    vi.mocked(clientPortalService.getClientProjectView).mockResolvedValue({
      data: {
        project: { id: "p1", name: "X" },
        progress: { tasks_done: 1, tasks_total: 3 },
        milestones: [],
        documents: [],
        decisions: [],
        client_requests: [],
        capabilities: { can_respond_to_requests: false },
        handover: null,
      },
      error: "",
    });
    const req = new Request("https://test/api/v1/projects/p1/client-view");
    const res = await GET(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.project.name).toBe("X");
  });

  it("passes stakeholder tenant context to client-view service after requireTenant", async () => {
    const stakeholderCtx = {
      tenantId: "t1",
      userId: "stakeholder-user",
      role: "stakeholder",
      subscriptionTier: "free",
      clientProfile: "web",
      traceId: "trace1",
    } as const;
    vi.mocked(tenant.getTenantContextFromRequest).mockResolvedValue(stakeholderCtx);
    vi.mocked(clientPortalService.getClientProjectView).mockResolvedValue({
      data: {
        project: { id: "p1", name: "Stakeholder View" },
        progress: { tasks_done: 0, tasks_total: 0 },
        milestones: [],
        documents: [],
        decisions: [],
        client_requests: [],
        capabilities: { can_respond_to_requests: false },
        handover: null,
      },
      error: "",
    });

    const req = new Request("https://test/api/v1/projects/p1/client-view");
    const res = await GET(req, { params: Promise.resolve({ id: "p1" }) });

    expect(res.status).toBe(200);
    expect(tenant.requireTenant).toHaveBeenCalledWith(stakeholderCtx);
    expect(clientPortalService.getClientProjectView).toHaveBeenCalledWith(expect.anything(), stakeholderCtx, "p1");
  });
});
