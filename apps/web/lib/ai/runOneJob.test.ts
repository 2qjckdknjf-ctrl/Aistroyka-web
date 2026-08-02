import { describe, expect, it, vi } from "vitest";
import { processOneJob } from "./runOneJob";

function createMockSupabase(overrides: {
  dequeue?: { data: unknown; error: { message: string } | null };
  media?: { data: unknown; error: { message: string } | null };
  claim?: { data: unknown; error: { message: string } | null };
  complete?: { error: unknown };
  onRpc?: (name: string, args: Record<string, unknown>) => void;
  onFrom?: (table: string) => void;
  onUpdateEq?: (col: string, val: unknown) => void;
}) {
  const eqCalls: Array<{ col: string; val: unknown }> = [];
  const selectChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockImplementation((col: string, val: unknown) => {
      eqCalls.push({ col, val });
      overrides.onUpdateEq?.(col, val);
      return selectChain;
    }),
    maybeSingle: vi.fn().mockImplementation(() =>
      Promise.resolve(overrides.media ?? { data: null, error: null })
    ),
    single: vi.fn().mockImplementation(() =>
      Promise.resolve(overrides.media ?? { data: null, error: null })
    ),
  };
  const updateChain = {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockImplementation((col: string, val: unknown) => {
      eqCalls.push({ col, val });
      overrides.onUpdateEq?.(col, val);
      return updateChain;
    }),
    in: vi.fn().mockResolvedValue({ error: null }),
  };

  const fromMock = vi.fn().mockImplementation((table: string) => {
    overrides.onFrom?.(table);
    if (table === "analysis_jobs") return updateChain;
    return selectChain;
  });

  const rpc = vi.fn().mockImplementation((name: string, args: Record<string, unknown> = {}) => {
    overrides.onRpc?.(name, args);
    if (name === "dequeue_tenant_job")
      return Promise.resolve(overrides.dequeue ?? { data: [], error: null });
    if (name === "dequeue_job")
      return Promise.resolve({ data: [{ id: "SHOULD_NOT_USE" }], error: null });
    if (name === "claim_job_execution")
      return Promise.resolve(overrides.claim ?? { data: true, error: null });
    if (name === "complete_analysis_job")
      return Promise.resolve({ error: overrides.complete?.error ?? null });
    return Promise.resolve({ data: null, error: null });
  });

  return {
    rpc,
    from: fromMock,
    eqCalls,
  } as unknown as ReturnType<typeof import("@supabase/supabase-js")["createClient"]> & {
    rpc: ReturnType<typeof vi.fn>;
    eqCalls: typeof eqCalls;
  };
}

const TENANT = "tenant-a";
const OPTS = { tenantId: TENANT };

describe("processOneJob (tenant-scoped)", () => {
  it("returns error when tenantId is missing", async () => {
    const supabase = createMockSupabase({});
    const out = await processOneJob(supabase, "https://api.example.com/analyze", {
      tenantId: "",
    });
    expect(out).toEqual({ ok: false, reason: "error", message: "tenantId is required" });
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("returns no_url when aiAnalysisUrl is missing", async () => {
    const supabase = createMockSupabase({});
    const out = await processOneJob(supabase, undefined, OPTS);
    expect(out).toEqual({ ok: false, reason: "no_url", message: "AI_ANALYSIS_URL is not set" });
  });

  it("returns no_url when aiAnalysisUrl is empty string", async () => {
    const supabase = createMockSupabase({});
    const out = await processOneJob(supabase, "   ", OPTS);
    expect(out).toEqual({ ok: false, reason: "no_url", message: "AI_ANALYSIS_URL is not set" });
  });

  it("calls only dequeue_tenant_job with exact p_tenant_id and never dequeue_job", async () => {
    const rpcNames: string[] = [];
    const supabase = createMockSupabase({
      dequeue: { data: [], error: null },
      onRpc: (name) => rpcNames.push(name),
    });
    await processOneJob(supabase, "https://api.example.com/analyze", OPTS);
    expect(rpcNames).toEqual(["dequeue_tenant_job"]);
    expect(supabase.rpc).toHaveBeenCalledWith("dequeue_tenant_job", {
      p_tenant_id: TENANT,
      p_region_id: null,
      p_worker_id: null,
    });
    expect(rpcNames).not.toContain("dequeue_job");
  });

  it("returns no_job when dequeue returns no job", async () => {
    const supabase = createMockSupabase({ dequeue: { data: [], error: null } });
    const out = await processOneJob(supabase, "https://api.example.com/analyze", OPTS);
    expect(out).toEqual({ ok: false, reason: "no_job" });
  });

  it("returns no_job when dequeue returns null", async () => {
    const supabase = createMockSupabase({ dequeue: { data: null, error: null } });
    const out = await processOneJob(supabase, "https://api.example.com/analyze", OPTS);
    expect(out).toEqual({ ok: false, reason: "no_job" });
  });

  it("returns error when dequeue RPC fails (no global fallback)", async () => {
    const supabase = createMockSupabase({
      dequeue: { data: null, error: { message: "function dequeue_tenant_job does not exist" } },
    });
    const out = await processOneJob(supabase, "https://api.example.com/analyze", OPTS);
    expect(out).toEqual({
      ok: false,
      reason: "error",
      message: "function dequeue_tenant_job does not exist",
    });
    expect(supabase.rpc).toHaveBeenCalledTimes(1);
    expect(supabase.rpc).toHaveBeenCalledWith("dequeue_tenant_job", expect.anything());
  });

  it("fails closed on returned tenant mismatch without media/claim/complete/AI", async () => {
    const rpcNames: string[] = [];
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const supabase = createMockSupabase({
      dequeue: {
        data: [{ id: "job-x", media_id: "media-1", tenant_id: "other-tenant" }],
        error: null,
      },
      onRpc: (name) => rpcNames.push(name),
    });
    const out = await processOneJob(supabase, "https://api.example.com/analyze", OPTS);
    vi.unstubAllGlobals();
    expect(out).toEqual({ ok: false, reason: "error", message: "Job processing rejected" });
    expect(rpcNames).toEqual(["dequeue_tenant_job"]);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("scopes media lookup by tenant_id", async () => {
    const eqs: Array<{ col: string; val: unknown }> = [];
    const supabase = createMockSupabase({
      dequeue: {
        data: [{ id: "job-1", media_id: "media-1", tenant_id: TENANT }],
        error: null,
      },
      media: { data: null, error: { message: "not found" } },
      onUpdateEq: (col, val) => eqs.push({ col, val }),
    });
    const out = await processOneJob(supabase, "https://api.example.com/analyze", OPTS);
    expect(out).toEqual({ ok: true, jobId: "job-1", status: "failed" });
    expect(eqs).toEqual(
      expect.arrayContaining([
        { col: "id", val: "media-1" },
        { col: "tenant_id", val: TENANT },
      ])
    );
  });

  it("scopes mark-failed updates by tenant_id", async () => {
    const eqs: Array<{ col: string; val: unknown }> = [];
    const supabase = createMockSupabase({
      dequeue: {
        data: [{ id: "job-1", media_id: "media-1", tenant_id: TENANT }],
        error: null,
      },
      media: { data: null, error: { message: "not found" } },
      onUpdateEq: (col, val) => eqs.push({ col, val }),
    });
    await processOneJob(supabase, "https://api.example.com/analyze", OPTS);
    expect(eqs).toEqual(
      expect.arrayContaining([
        { col: "id", val: "job-1" },
        { col: "tenant_id", val: TENANT },
      ])
    );
  });

  it("returns failed with jobId when claim_job_execution fails", async () => {
    const jobId = "job-1";
    const supabase = createMockSupabase({
      dequeue: { data: [{ id: jobId, media_id: "media-1", tenant_id: TENANT }], error: null },
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
    const out = await processOneJob(supabase, "https://api.example.com/analyze", OPTS);
    expect(out).toEqual({ ok: true, jobId, status: "failed" });
  });

  it("returns failed with jobId when type is video", async () => {
    const jobId = "job-1";
    const supabase = createMockSupabase({
      dequeue: { data: [{ id: jobId, media_id: "media-1", tenant_id: TENANT }], error: null },
      media: {
        data: {
          file_url: "https://storage/photo.jpg",
          project_id: "proj-1",
          type: "video",
        },
        error: null,
      },
    });
    const out = await processOneJob(supabase, "https://api.example.com/analyze", OPTS);
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
      dequeue: { data: [{ id: jobId, media_id: "media-1", tenant_id: TENANT }], error: null },
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
    const out = await processOne(supabase, "https://api.example.com/analyze", OPTS);
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
      dequeue: { data: [{ id: jobId, media_id: "media-1", tenant_id: TENANT }], error: null },
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
    const out = await processOne(supabase, "https://api.example.com/analyze", OPTS);
    vi.unstubAllGlobals();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(out).toEqual({ ok: true, jobId, status: "completed" });
  });
});
