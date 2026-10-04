import { beforeEach, describe, expect, it, vi } from "vitest";
import { createVisionAnalysisJob } from "./create-vision-job.service";

const createAnalysisJob = vi.fn();

vi.mock("@/lib/api/engine", () => ({
  createAnalysisJob: (...args: unknown[]) => createAnalysisJob(...args),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn(() => null),
}));

describe("createVisionAnalysisJob", () => {
  beforeEach(() => {
    createAnalysisJob.mockReset();
  });
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
    expect(createAnalysisJob).not.toHaveBeenCalled();
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
                  attempt_count: 1,
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
    expect(createAnalysisJob).not.toHaveBeenCalled();
  });

  it("creates jobs through the service-role engine helper", async () => {
    createAnalysisJob.mockResolvedValue({ id: "job-new", media_id: "media-1", status: "queued" });
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
      if (table === "analysis_jobs") {
        return {
          select: () => ({
            eq: () => ({
              in: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
          }),
        };
      }
      return {};
    });
    const r = await createVisionAnalysisJob({ from } as never, {
      tenantId: "t1",
      projectId: "p1",
      mediaId: "media-1",
    });
    expect(r).toMatchObject({ ok: true, created: true, jobId: "job-new", lifecycle: "QUEUED" });
    expect(createAnalysisJob).toHaveBeenCalledWith(expect.anything(), {
      tenant_id: "t1",
      media_id: "media-1",
      priority: "normal",
      request_key: null,
    });
  });

  it("binds request_key through the engine RPC when reusing an active job", async () => {
    createAnalysisJob.mockResolvedValue({ id: "job-active", media_id: "media-1", status: "queued" });
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
      if (table === "analysis_jobs") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
              in: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: "job-active",
                    status: "queued",
                    error_type: null,
                    attempt_count: 0,
                    media_id: "media-1",
                  },
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      return {};
    });
    const r = await createVisionAnalysisJob({ from } as never, {
      tenantId: "t1",
      projectId: "p1",
      mediaId: "media-1",
      requestKey: "idem-active",
    });
    expect(r).toMatchObject({ ok: true, created: false, jobId: "job-active", lifecycle: "QUEUED" });
    expect(createAnalysisJob).toHaveBeenCalledWith(expect.anything(), {
      tenant_id: "t1",
      media_id: "media-1",
      priority: "normal",
      request_key: "idem-active",
    });
  });

  it("rejects a non-string request_key", async () => {
    const r = await createVisionAnalysisJob({ from: vi.fn() } as never, {
      tenantId: "t1",
      projectId: "p1",
      mediaId: "media-1",
      requestKey: 1 as never,
    });
    expect(r).toMatchObject({ ok: false, status: 400 });
  });
});
