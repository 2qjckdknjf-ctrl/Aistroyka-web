import { describe, expect, it, vi } from "vitest";
import { processOneJob } from "./runOneJob";

function createMockSupabase(overrides: {
  dequeue?: { data: unknown; error: { message: string } | null };
  media?: { data: unknown; error: { message: string } | null };
  claim?: { data: unknown; error: { message: string } | null };
  complete?: { error: unknown };
}) {
  const selectChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() =>
      Promise.resolve(overrides.media?.data ? { ...overrides.media, data: { ...overrides.media.data as object, tenant_id: "tenant-a" } } : overrides.media ?? { data: null, error: null })
    ),
  };
  const updateChain = {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(), or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    limit: vi.fn(async () => {
      const r = overrides.dequeue ?? { data: [], error: null };
      const rows = Array.isArray(r.data) ? r.data : r.data ? [r.data] : [];
      return { ...r, data: rows.map((x: unknown) => ({ ...x as object, tenant_id: "tenant-a" })) };
    }),
    maybeSingle: vi.fn(async () => {
      const r = overrides.dequeue ?? { data: [], error: null };
      const row = Array.isArray(r.data) ? r.data[0] : r.data;
      if (overrides.claim?.error) return { data: null, error: overrides.claim.error };
      return { data: row ? { ...row as object, tenant_id: "tenant-a", execution_token: "token-a" } : null, error: null };
    }),
  };

  const fromMock = vi.fn().mockImplementation((table: string) => {
    if (table === "analysis_jobs") return updateChain;
    return selectChain;
  });

  return {
    rpc: vi.fn().mockImplementation((name: string) => {
      if (name === "dequeue_job")
        return Promise.resolve(overrides.dequeue ?? { data: [], error: null });
      if (name === "claim_job_execution")
        return Promise.resolve(overrides.claim ?? { data: true, error: null });
      if (name === "complete_session_analysis_job")
        return Promise.resolve({ error: overrides.complete?.error ?? null });
      if (name === "fail_session_analysis_job")
        return Promise.resolve({ data: 1, error: null });
      return Promise.resolve({ data: null, error: null });
    }),
    from: fromMock,
  } as unknown as ReturnType<typeof import("@supabase/supabase-js")["createClient"]>;
}

describe("processOneJob", () => {
  it("returns no_url when aiAnalysisUrl is missing", async () => {
    const supabase = createMockSupabase({});
    const out = await processOneJob(supabase, undefined, { tenantId: "tenant-a", callerClient: supabase });
    expect(out).toEqual({ ok: false, reason: "no_url", message: "AI_ANALYSIS_URL is not set" });
  });

  it("returns no_url when aiAnalysisUrl is empty string", async () => {
    const supabase = createMockSupabase({});
    const out = await processOneJob(supabase, "   ", { tenantId: "tenant-a", callerClient: supabase });
    expect(out).toEqual({ ok: false, reason: "no_url", message: "AI_ANALYSIS_URL is not set" });
  });

  it("returns no_job when candidate read returns no job", async () => {
    const supabase = createMockSupabase({ dequeue: { data: [], error: null } });
    const out = await processOneJob(supabase, "https://api.example.com/analyze", { tenantId: "tenant-a", callerClient: supabase });
    expect(out).toEqual({ ok: false, reason: "no_job" });
  });

  it("returns no_job when candidate read returns null", async () => {
    const supabase = createMockSupabase({ dequeue: { data: null, error: null } });
    const out = await processOneJob(supabase, "https://api.example.com/analyze", { tenantId: "tenant-a", callerClient: supabase });
    expect(out).toEqual({ ok: false, reason: "no_job" });
  });

  it("returns error when candidate read fails", async () => {
    const supabase = createMockSupabase({
      dequeue: { data: null, error: { message: "connection failed" } },
    });
    const out = await processOneJob(supabase, "https://api.example.com/analyze", { tenantId: "tenant-a", callerClient: supabase });
    expect(out).toEqual({ ok: false, reason: "error", message: "connection failed" });
  });

  it("returns failed with jobId when media is missing", async () => {
    const jobId = "job-1";
    const supabase = createMockSupabase({
      dequeue: { data: [{ id: jobId, media_id: "media-1" }], error: null },
      media: { data: null, error: { message: "not found" } },
    });
    const out = await processOneJob(supabase, "https://api.example.com/analyze", { tenantId: "tenant-a", callerClient: supabase });
    expect(out).toEqual({ ok: true, jobId, status: "failed" });
  });

  it("returns error without failing a job when atomic claim fails", async () => {
    const jobId = "job-1";
    const supabase = createMockSupabase({
      dequeue: { data: [{ id: jobId, media_id: "media-1" }], error: null },
      media: {
        data: {
          file_url: "https://storage/photo.jpg",
          project_id: "proj-1",
          type: "image",
        },
        error: null,
      },
      claim: { data: null, error: { message: "Job already claimed" } },
    });
    const out = await processOneJob(supabase, "https://api.example.com/analyze", { tenantId: "tenant-a", callerClient: supabase });
    expect(out).toEqual({ ok: false, reason: "error", message: "Job already claimed" });
    expect(supabase.rpc).not.toHaveBeenCalled();
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
        },
        error: null,
      },
    });
    const out = await processOneJob(supabase, "https://api.example.com/analyze", { tenantId: "tenant-a", callerClient: supabase });
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
        headers: new Headers(),
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
        },
        error: null,
      },
      claim: { data: true, error: null },
    });
    const out = await processOne(supabase, "https://api.example.com/analyze", { tenantId: "tenant-a", callerClient: supabase });
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
        headers: new Headers(),
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
        },
        error: null,
      },
      claim: { data: true, error: null },
    });
    const out = await processOne(supabase, "https://api.example.com/analyze", { tenantId: "tenant-a", callerClient: supabase });
    vi.unstubAllGlobals();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(out).toEqual({ ok: true, jobId, status: "completed" });
  });

  it("records 400 provider failures as invalid_request without retrying", async () => {
    const jobId = "job-400";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: () => Promise.resolve("quota details must not leak"),
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
        },
        error: null,
      },
      claim: { data: true, error: null },
    });
    const out = await processOne(supabase, "https://api.example.com/analyze", { tenantId: "tenant-a", callerClient: supabase });
    vi.unstubAllGlobals();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(out).toEqual({ ok: true, jobId, status: "failed" });
    expect(supabase.rpc).toHaveBeenCalledWith(
      "fail_session_analysis_job",
      expect.objectContaining({
        p_job_id: jobId,
        p_error_type: "invalid_request",
        p_error_message: "AI analysis failed: 400",
      })
    );
  });
});
