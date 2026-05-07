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
  listPortalProjects: vi.fn(),
}));

describe("GET /api/v1/portal/projects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns project list for authorized tenant", async () => {
    vi.mocked(portalService.listPortalProjects).mockResolvedValue({
      data: [{ id: "p1", name: "Tower" }],
      error: "",
    });
    const res = await GET(new Request("https://test/api/v1/portal/projects"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe("p1");
    expect(tenant.requireTenant).toHaveBeenCalled();
  });

  it("returns 400 when list service errors", async () => {
    vi.mocked(portalService.listPortalProjects).mockResolvedValue({
      data: [],
      error: "db error",
    });
    const res = await GET(new Request("https://test/api/v1/portal/projects"));
    expect(res.status).toBe(400);
  });
});
