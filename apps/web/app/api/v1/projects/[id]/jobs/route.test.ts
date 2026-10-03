import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn(),
}));
vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn(),
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {},
}));
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

describe("POST /api/v1/projects/:id/jobs", () => {
  it("returns 202 with queued lifecycle", async () => {
    vi.mocked(getTenantContextFromRequest).mockResolvedValue({ tenantId: "t1", userId: "u1" } as never);
    vi.mocked(requireTenant).mockReturnValue(undefined as never);
    vi.mocked(createClientFromRequest).mockResolvedValue({} as never);
    vi.mocked(getProject).mockResolvedValue({ data: { id: "p1" }, error: "" } as never);
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
});
