import { describe, expect, it, vi } from "vitest";
import { processOneJob } from "./runOneJob";

function createMockSupabase(overrides: {
  dequeue?: { data: unknown; error: { message: string } | null };
  media?: { data: unknown; error: { message: string } | null };
  claim?: { data: unknown; error: { message: string } | null };
  complete?: { error: unknown };
  tenantQueued?: { data: unknown; error: { message: string } | null };
  tenantClaim?: { data: unknown; error: { message: string } | null };
}) {
  const mediaChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() =>
      Promise.resolve(overrides.media ?? { data: null, error: null })
    ),
  };

  const failUpdateChain = {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockResolvedValue({ error: null }),
  };

  const tenantListChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockImplementation(() =>
      Promise.resolve(overrides.tenantQueued ?? { data: [], error: null })
    ),
  };

  const tenantClaimChain = {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockImplementation(() =>
      Promise.resolve(overrides.tenantClaim ?? { data: null, error: null })
    ),
  };

  let analysisJobsCall = 0;
  const fromMock = vi.fn().mockImplementation((table: string) => {
    if (table === "media") return mediaChain;
    if (table === "analysis_jobs") {
      analysisJobsCall += 1;
      // Tenant path: first call lists queued jobs; second claims one.
      // Global path / mark failed: update chain without select/limit.
      if (overrides.tenantQueued || overrides.tenantClaim) {
        if (analysisJobsCall === 1) return tenantListChain;
        if (analysisJobsCall === 2) return tenantClaimChain;
      }
      return failUpdateChain;
    }
    return mediaChain;
  });

  return {
    rpc: vi.fn().mockImplementation((name: string) => {
      if (name === "dequeue_job")
        return Promise.resolve(overrides.dequeue ?? { data: [], error: null });
      if (name === "claim_job_execution")
        return Promise.resolve(overrides.claim ?? { data: true, error: null });
      if (name === "complete_analysis_job")
        return Promise.resolve({ error: overrides.complete?.error ?? null });
      return Promise.resolve({ data: null, error: null });
    }),
    from: fromMock,
  } as unknown as ReturnType<typeof import("@supabase/supabase-js")["createClient"]>;
}

describe("processOneJob", () => {
  it("returns no_url when aiAnalysisUrl is missing", async () => {
    const supabase = createMockSupabase({});
    const out = await processOneJob(supabase, undefined);
    expect(out).toEqual({ ok: false, reason: "no_url", message: "AI_ANALYSIS_URL is not set" });
  });

  it("returns no_url when aiAnalysisUrl is empty string", async () => {
    const supabase = createMockSupabase({});
    const out = await processOneJob(supabase, "   ");
    expect(out).toEqual({ ok: false, reason: "no_url", message: "AI_ANALYSIS_URL is not set" });
  });

  it("returns no_job when dequeue returns no job", async () => {
    const supabase = createMockSupabase({ dequeue: { data: [], error: null } });
    const out = await processOneJob(supabase, "https://api.example.com/analyze");
    expect(out).toEqual({ ok: false, reason: "no_job" });
  });

  it("returns no_job when dequeue returns null", async () => {
    const supabase = createMockSupabase({ dequeue: { data: null, error: null } });
    const out = await processOneJob(supabase, "https://api.example.com/analyze");
    expect(out).toEqual({ ok: false, reason: "no_job" });
  });

  it("returns error when dequeue RPC fails", async () => {
    const supabase = createMockSupabase({
      dequeue: { data: null, error: { message: "connection failed" } },
    });
    const out = await processOneJob(supabase, "https://api.example.com/analyze");
    expect(out).toEqual({ ok: false, reason: "error", message: "connection failed" });
  });

  it("returns failed with jobId when media is missing", async () => {
    const jobId = "job-1";
    const supabase = createMockSupabase({
      dequeue: { data: [{ id: jobId, media_id: "media-1" }], error: null },
      media: { data: null, error: { message: "not found" } },
    });
    const out = await processOneJob(supabase, "https://api.example.com/analyze");
    expect(out).toEqual({ ok: true, jobId, status: "failed" });
  });

  it("returns failed with jobId when claim_job_execution fails", async () => {
    const jobId = "job-1";
    const supabase = createMockSupabase({
      dequeue: { data: [{ id: jobId, media_id: "media-1" }], error: null },
      media: {
        data: {
          file_url: "https://storage/photo.jpg",
          project_id: "proj-1",
          type: "image",
          tenant_id: "tenant-a",
        },
        error: null,
      },
      claim: { data: null, error: { message: "Job already claimed" } },
    });
    const out = await processOneJob(supabase, "https://api.example.com/analyze");
    expect(out).toEqual({ ok: true, jobId, status: "failed" });
  });

  it("returns failed with jobId when type is video", async () => {
    const jobId = "job-1";
    const supabase = createMockSupabase({
      dequeue: { data: [{ id: jobId, media_id: "media-1" }], error: null },
      media: {
        data: {
          file_url: "https://storage/photo.jpg",
          project_id: "proj-1",
          type: "video",
          tenant_id: "tenant-a",
        },
        error: null,
      },
    });
    const out = await processOneJob(supabase, "https://api.example.com/analyze");
    expect(out).toEqual({ ok: true, jobId, status: "failed" });
  });

  it("returns completed when AI returns valid result and complete_analysis_job succeeds", async () => {
    const jobId = "job-1";
    const validResult = {
      stage: "framing",
      completion_percent: 60,
      risk_level: "low" as const,
      detected_issues: [] as string[],
      recommendations: [] as string[],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(validResult),
      })
    );
    const { processOneJob: processOne } = await import("./runOneJob");
    const supabase = createMockSupabase({
      dequeue: { data: [{ id: jobId, media_id: "media-1" }], error: null },
      media: {
        data: {
          file_url: "https://storage/photo.jpg",
          project_id: "proj-1",
          type: "image",
          tenant_id: "tenant-a",
        },
        error: null,
      },
      claim: { data: true, error: null },
    });
    const out = await processOne(supabase, "https://api.example.com/analyze");
    vi.unstubAllGlobals();
    expect(out).toEqual({ ok: true, jobId, status: "completed" });
  });

  it("retries on 5xx and completes when second attempt succeeds", async () => {
    const jobId = "job-retry";
    const validResult = {
      stage: "foundation",
      completion_percent: 40,
      risk_level: "medium" as const,
      detected_issues: [] as string[],
      recommendations: [] as string[],
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: () => Promise.resolve("Service Unavailable"),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(validResult),
      });
    vi.stubGlobal("fetch", fetchMock);
    const { processOneJob: processOne } = await import("./runOneJob");
    const supabase = createMockSupabase({
      dequeue: { data: [{ id: jobId, media_id: "media-1" }], error: null },
      media: {
        data: {
          file_url: "https://storage/photo.jpg",
          project_id: "proj-1",
          type: "image",
          tenant_id: "tenant-a",
        },
        error: null,
      },
      claim: { data: true, error: null },
    });
    const out = await processOne(supabase, "https://api.example.com/analyze");
    vi.unstubAllGlobals();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(out).toEqual({ ok: true, jobId, status: "completed" });
  });

  it("with tenantId claims only that tenant's queued job and never calls global dequeue", async () => {
    const jobId = "job-tenant";
    const validResult = {
      stage: "framing",
      completion_percent: 50,
      risk_level: "low" as const,
      detected_issues: [] as string[],
      recommendations: [] as string[],
    };
    vi.stubEnv("CRON_SECRET", "test-cron-secret");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(validResult),
    });
    vi.stubGlobal("fetch", fetchMock);
    const { processOneJob: processOne } = await import("./runOneJob");
    const supabase = createMockSupabase({
      tenantQueued: {
        data: [{ id: jobId, media_id: "media-1", tenant_id: "tenant-a" }],
        error: null,
      },
      tenantClaim: {
        data: { id: jobId, media_id: "media-1", tenant_id: "tenant-a" },
        error: null,
      },
      media: {
        data: {
          file_url: "https://storage/photo.jpg",
          project_id: "proj-1",
          type: "image",
          tenant_id: "tenant-a",
        },
        error: null,
      },
      claim: { data: true, error: null },
    });
    const out = await processOne(supabase, "https://api.example.com/analyze", {
      tenantId: "tenant-a",
    });
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    expect(supabase.rpc).not.toHaveBeenCalledWith("dequeue_job", expect.anything());
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/analyze",
      expect.objectContaining({
        headers: expect.objectContaining({ "x-cron-secret": "test-cron-secret" }),
      })
    );
    expect(out).toEqual({ ok: true, jobId, status: "completed" });
  });

  it("with tenantId returns no_job when tenant has no queued jobs", async () => {
    const supabase = createMockSupabase({
      tenantQueued: { data: [], error: null },
    });
    const out = await processOneJob(supabase, "https://api.example.com/analyze", {
      tenantId: "tenant-a",
    });
    expect(out).toEqual({ ok: false, reason: "no_job" });
    expect(supabase.rpc).not.toHaveBeenCalledWith("dequeue_job", expect.anything());
  });
});
