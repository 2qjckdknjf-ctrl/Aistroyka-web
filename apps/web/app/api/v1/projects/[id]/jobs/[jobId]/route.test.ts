import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { canReadProjects } from "@/lib/tenant";
import * as projectService from "@/lib/domain/projects/project.service";

const { maybeSingle, getTenantContextFromRequest } = vi.hoisted(() => ({
  maybeSingle: vi.fn(),
  getTenantContextFromRequest: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn().mockResolvedValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle,
        }),
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

describe("GET /api/v1/projects/:id/jobs/:jobId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getTenantContextFromRequest.mockResolvedValue({
      tenantId: "t1",
      userId: "u1",
      role: "viewer",
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

  it("denies stakeholder access to internal vision job details", async () => {
    vi.mocked(canReadProjects).mockReturnValue(false);
    const res = await GET(new Request("https://test/api/v1/projects/p1/jobs/j1"), {
      params: Promise.resolve({ id: "p1", jobId: "j1" }),
    });
    expect(res.status).toBe(403);
    expect(maybeSingle).not.toHaveBeenCalled();
  });

  it("allows an internal viewer and maps attempt_count into lifecycle", async () => {
    maybeSingle
      .mockResolvedValueOnce({
        data: {
          id: "j1",
          tenant_id: "t1",
          media_id: "m1",
          status: "failed",
          error_type: "timeout",
          error_message: "AI analysis failed: 504",
          attempt_count: 1,
          started_at: null,
          finished_at: null,
        },
        error: null,
      })
      .mockResolvedValueOnce({ data: { project_id: "p1" }, error: null });
    const res = await GET(new Request("https://test/api/v1/projects/p1/jobs/j1"), {
      params: Promise.resolve({ id: "p1", jobId: "j1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.lifecycle).toBe("FAILED_RETRYABLE");
    expect(body.data.attempt_count).toBe(1);
  });
});
