import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { canReadProjects } from "@/lib/tenant";
import * as projectService from "@/lib/domain/projects/project.service";

const { getTenantContextFromRequest } = vi.hoisted(() => ({
  getTenantContextFromRequest: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn().mockResolvedValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }),
  }),
}));
vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest,
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {},
  canReadProjects: vi.fn(() => true),
}));
vi.mock("@/lib/domain/projects/project.service", () => ({
  getProject: vi.fn(),
}));

describe("GET /api/v1/projects/:id/poll-status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getTenantContextFromRequest.mockResolvedValue({
      tenantId: "t1",
      userId: "u1",
      role: "member",
      subscriptionTier: "free",
      clientProfile: "web",
      traceId: "trace1",
    });
    vi.mocked(canReadProjects).mockReturnValue(true);
    vi.mocked(projectService.getProject).mockResolvedValue({
      data: { id: "p1", tenant_id: "t1" } as never,
      error: null,
    });
  });

  it("returns jobs: [] when the project has no media", async () => {
    const res = await GET(new Request("https://test/api/v1/projects/p1/poll-status"), {
      params: Promise.resolve({ id: "p1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.hasActiveJobs).toBe(false);
    expect(body.data.jobs).toEqual([]);
  });

  it("denies portal stakeholders", async () => {
    vi.mocked(canReadProjects).mockReturnValue(false);
    const res = await GET(new Request("https://test/api/v1/projects/p1/poll-status"), {
      params: Promise.resolve({ id: "p1" }),
    });
    expect(res.status).toBe(403);
  });
});
