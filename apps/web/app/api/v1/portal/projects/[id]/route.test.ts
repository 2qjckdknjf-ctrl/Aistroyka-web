import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET } from "./route";
import * as portalService from "@/lib/domain/portal/portal.service";
import * as tenant from "@/lib/tenant";

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
vi.mock("@/lib/domain/portal/portal.service", () => ({
  getPortalProjectView: vi.fn(),
}));

describe("GET /api/v1/portal/projects/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 when portal access denied", async () => {
    vi.mocked(portalService.getPortalProjectView).mockResolvedValue({
      data: null,
      error: "Insufficient rights",
    });
    const res = await GET(new Request("https://test/api/v1/portal/projects/p1"), {
      params: Promise.resolve({ id: "p1" }),
    });
    expect(res.status).toBe(403);
  });

  it("returns client view payload on success", async () => {
    vi.mocked(portalService.getPortalProjectView).mockResolvedValue({
      data: {
        project: { id: "p1", name: "X" },
        progress: { tasks_done: 0, tasks_total: 0 },
        milestones: [],
        documents: [],
        decisions: [],
        client_requests: [],
        capabilities: { can_respond_to_requests: true },
        handover: null,
      },
      error: "",
    });
    const res = await GET(new Request("https://test/api/v1/portal/projects/p1"), {
      params: Promise.resolve({ id: "p1" }),
    });
    expect(res.status).toBe(200);
  });
});
