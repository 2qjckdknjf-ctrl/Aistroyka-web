import { describe, expect, it, vi } from "vitest";
import { createVisionAnalysisJob } from "./create-vision-job.service";

vi.mock("@/lib/api/rpcClient", () => ({
  createAnalysisJobRpc: vi.fn(async () => ({
    id: "job-new",
    media_id: "media-1",
    tenant_id: "t1",
    status: "queued",
    started_at: "2026-10-03T00:00:00Z",
    finished_at: null,
    error_message: null,
  })),
}));

describe("createVisionAnalysisJob", () => {
  it("returns 404 when media is missing or belongs to another project", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: { id: "m", tenant_id: "t1", project_id: "other" }, error: null }),
          }),
        }),
      }),
    };
    const r = await createVisionAnalysisJob(supabase as never, {
      tenantId: "t1",
      projectId: "p1",
      mediaId: "m",
    });
    expect(r).toMatchObject({ ok: false, status: 404 });
  });

  it("reuses request_key without creating a second job", async () => {
    const from = vi.fn((table: string) => {
      if (table === "media") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { id: "media-1", tenant_id: "t1", project_id: "p1" },
                error: null,
              }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: "job-existing",
                  status: "completed",
                  error_type: null,
                  attempts: 1,
                  media_id: "media-1",
                },
                error: null,
              }),
            }),
          }),
        }),
      };
    });
    const r = await createVisionAnalysisJob({ from } as never, {
      tenantId: "t1",
      projectId: "p1",
      mediaId: "media-1",
      requestKey: "idem-1",
    });
    expect(r).toMatchObject({ ok: true, created: false, jobId: "job-existing", lifecycle: "SUCCEEDED" });
  });
});
