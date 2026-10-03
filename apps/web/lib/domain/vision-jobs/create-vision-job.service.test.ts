import { beforeEach, describe, expect, it, vi } from "vitest";
import { createVisionAnalysisJob } from "./create-vision-job.service";

const createAnalysisJob = vi.fn(async () => ({
  id: "job-new",
  media_id: "media-1",
  status: "queued",
}));
const getAdminClient = vi.fn();

vi.mock("@/lib/api/engine", () => ({
  createAnalysisJob: (...args: unknown[]) => createAnalysisJob(...args),
}));
vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: (...args: unknown[]) => getAdminClient(...args),
}));

function mediaFrom() {
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

describe("createVisionAnalysisJob", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createAnalysisJob.mockResolvedValue({
      id: "job-new",
      media_id: "media-1",
      status: "queued",
    });
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
      if (table === "media") return mediaFrom();
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
    expect(createAnalysisJob).not.toHaveBeenCalled();
  });

  it("creates through createAnalysisJob and fails closed if request_key cannot be persisted", async () => {
    const from = vi.fn((table: string) => {
      if (table === "media") return mediaFrom();
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
            in: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
        }),
      };
    });
    getAdminClient.mockReturnValue({
      from: () => ({
        update: () => ({
          eq: () => ({
            eq: () => ({
              is: () => ({
                select: () => ({
                  maybeSingle: async () => ({ data: null, error: { message: "RLS denied" } }),
                }),
              }),
            }),
          }),
        }),
      }),
    });
    const r = await createVisionAnalysisJob({ from } as never, {
      tenantId: "t1",
      projectId: "p1",
      mediaId: "media-1",
      requestKey: "idem-1",
    });
    expect(createAnalysisJob).toHaveBeenCalledTimes(1);
    expect(r).toMatchObject({ ok: false, status: 503 });
  });

  it("reuses the keyed job when persist hits a unique violation", async () => {
    const from = vi.fn((table: string) => {
      if (table === "media") return mediaFrom();
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
            in: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
        }),
      };
    });
    getAdminClient.mockReturnValue({
      from: () => ({
        update: () => ({
          eq: () => ({
            eq: () => ({
              is: () => ({
                select: () => ({
                  maybeSingle: async () => ({ data: null, error: { code: "23505", message: "duplicate key" } }),
                }),
              }),
            }),
          }),
        }),
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: "job-winner",
                  status: "queued",
                  error_type: null,
                  attempts: 0,
                  media_id: "media-1",
                },
                error: null,
              }),
            }),
          }),
        }),
      }),
    });
    const r = await createVisionAnalysisJob({ from } as never, {
      tenantId: "t1",
      projectId: "p1",
      mediaId: "media-1",
      requestKey: "idem-1",
    });
    expect(r).toMatchObject({ ok: true, created: false, jobId: "job-winner" });
  });
});
