import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn(),
}));
vi.mock("@/lib/tenant", async () => {
  const actual = await vi.importActual<typeof import("@/lib/tenant")>("@/lib/tenant");
  return {
    ...actual,
    getTenantContextFromRequest: vi.fn(),
    requireTenant: vi.fn(),
  };
});
vi.mock("@/lib/domain/projects/project.service", () => ({
  getProject: vi.fn(),
}));
vi.mock("@/lib/domain/vision-jobs/create-vision-job.service", () => ({
  createVisionAnalysisJob: vi.fn(),
}));

import { POST } from "./route";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant } from "@/lib/tenant";
import { getProject } from "@/lib/domain/projects/project.service";
import { createVisionAnalysisJob } from "@/lib/domain/vision-jobs/create-vision-job.service";

function tenantCtx(role: "member" | "viewer") {
  return { tenantId: "t1", userId: "u1", role } as never;
}

describe("POST /api/v1/projects/:id/jobs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 202 with queued lifecycle", async () => {
    vi.mocked(getTenantContextFromRequest).mockResolvedValue(tenantCtx("member"));
    vi.mocked(requireTenant).mockReturnValue(undefined as never);
    vi.mocked(createClientFromRequest).mockResolvedValue({} as never);
    vi.mocked(getProject).mockResolvedValue({ data: { id: "p1", tenant_id: "t1" }, error: "" } as never);
    vi.mocked(createVisionAnalysisJob).mockResolvedValue({
      ok: true,
      created: true,
      jobId: "job-1",
      status: "queued",
      lifecycle: "QUEUED",
    });
    const res = await POST(
      new Request("http://localhost/api/v1/projects/p1/jobs", {
        method: "POST",
        body: JSON.stringify({ media_id: "m1", request_key: "k1" }),
      }),
      { params: Promise.resolve({ id: "p1" }) }
    );
    expect(res.status).toBe(202);
    const json = await res.json();
    expect(json.data.lifecycle).toBe("QUEUED");
    expect(json.data.jobId).toBe("job-1");
  });

  it("returns 403 when a viewer tries to enqueue analysis", async () => {
    vi.mocked(getTenantContextFromRequest).mockResolvedValue(tenantCtx("viewer"));
    vi.mocked(requireTenant).mockReturnValue(undefined as never);
    vi.mocked(createClientFromRequest).mockResolvedValue({} as never);
    vi.mocked(getProject).mockResolvedValue({ data: { id: "p1", tenant_id: "t1" }, error: "" } as never);
    const res = await POST(
      new Request("http://localhost/api/v1/projects/p1/jobs", {
        method: "POST",
        body: JSON.stringify({ media_id: "m1" }),
      }),
      { params: Promise.resolve({ id: "p1" }) }
    );
    expect(res.status).toBe(403);
    expect(createVisionAnalysisJob).not.toHaveBeenCalled();
  });
});
