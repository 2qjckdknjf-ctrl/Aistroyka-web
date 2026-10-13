vi.mock("@/lib/platform/ai/resolve-ai-media-image", () => ({ resolveAIMediaImage: vi.fn(async (_client: unknown, input: { projectIdClaim: string }) => ({ ok: true, imageUrl: "https://storage.test/private-signed?token=synthetic", objectPath: "private/source.png", trustedProjectId: input.projectIdClaim, source: "media" })) }));
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { processOneJob } from "./runOneJob";

const result = { stage: "foundation", completion_percent: 20, risk_level: "low", detected_issues: [], recommendations: [] };
function fixture({ foreignCandidate = false, foreignMedia = false, loseClaim = false } = {}) {
  let claimed = false;
  const read = { select: vi.fn(() => read), eq: vi.fn(() => read), is: vi.fn(() => read), or: vi.fn(() => read), order: vi.fn(() => read),
    limit: vi.fn(async () => ({ data: [{ id: "job-a", media_id: "media-a", tenant_id: foreignCandidate ? "tenant-b" : "tenant-a" }], error: null })) };
  const write = { update: vi.fn(() => write), eq: vi.fn(() => write), is: vi.fn(() => write), or: vi.fn(() => write), select: vi.fn(() => write),
    maybeSingle: vi.fn(async () => {
      if (claimed || loseClaim) return { data: null, error: null };
      claimed = true;
      return { data: { id: "job-a", media_id: "media-a", tenant_id: "tenant-a", execution_token: "claim-a" }, error: null };
    }) };
  const media = { select: vi.fn(() => media), eq: vi.fn(() => media), single: vi.fn(async () => ({ data: {
    tenant_id: foreignMedia ? "tenant-b" : "tenant-a", file_url: "https://safe.test/photo.jpg", project_id: "project-a", type: "image",
  }, error: null })) };
  const caller = { from: vi.fn(() => read) };
  const admin = { from: vi.fn((table: string) => table === "analysis_jobs" ? write : media), rpc: vi.fn(async () => ({ data: 1, error: null })) };
  const run = () => processOneJob(admin as unknown as SupabaseClient, "https://safe.test/api/ai/analyze-image", {
    tenantId: "tenant-a", callerClient: caller as unknown as SupabaseClient, aiRequestHeaders: { Authorization: "Bearer test-only" },
  });
  return { caller, admin, read, write, media, run };
}
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe("session worker scope and ownership", () => {
  it("has no global dequeue fallback when scope is missing", async () => {
    const f = fixture();
    expect((await processOneJob(f.admin as unknown as SupabaseClient, "https://safe.test", undefined as never)).ok).toBe(false);
    expect(f.admin.from).not.toHaveBeenCalled(); expect(f.admin.rpc).not.toHaveBeenCalled();
  });
  it("ignores foreign candidates even if a faulty reader returns them", async () => {
    const f = fixture({ foreignCandidate: true });
    expect(await f.run()).toEqual({ ok: false, reason: "no_job" });
    expect(f.admin.from).not.toHaveBeenCalled();
  });
  it("does not fail or execute a job when it loses the claim", async () => {
    const f = fixture({ loseClaim: true }); const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    expect(await f.run()).toEqual({ ok: false, reason: "no_job" });
    expect(fetchMock).not.toHaveBeenCalled(); expect(f.admin.rpc).not.toHaveBeenCalled();
  });
  it("concurrent callers execute a candidate only once and retain tenant/token scope", async () => {
    const f = fixture(); const fetchMock = vi.fn(async () => Response.json(result)); vi.stubGlobal("fetch", fetchMock);
    const outputs = await Promise.all([f.run(), f.run()]);
    expect(outputs.filter(x => x.ok)).toHaveLength(1); expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(f.read.eq).toHaveBeenCalledWith("tenant_id", "tenant-a");
    expect(f.write.eq).toHaveBeenCalledWith("tenant_id", "tenant-a");
    expect(f.write.eq).toHaveBeenCalledWith("status", "queued");
    expect(f.write.is).toHaveBeenCalledWith("execution_token", null);
    expect(f.read.or).toHaveBeenCalledWith(expect.stringContaining("next_retry_at.lte."));
    expect(f.admin.rpc).toHaveBeenCalledWith("complete_session_analysis_job", expect.objectContaining({ p_tenant_id: "tenant-a", p_execution_token: "claim-a" }));
    expect(fetchMock.mock.calls[0][1]).toEqual(expect.objectContaining({ redirect: "manual", headers: expect.objectContaining({ authorization: "Bearer test-only" }) }));
  });
  it("does not send foreign media to the provider", async () => {
    const f = fixture({ foreignMedia: true }); const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    expect(await f.run()).toEqual({ ok: true, jobId: "job-a", status: "failed" });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(f.admin.rpc).toHaveBeenCalledWith("fail_session_analysis_job", expect.objectContaining({ p_tenant_id: "tenant-a", p_execution_token: "claim-a" }));
  });
  it("does not mark a deterministic fallback as completed", async () => {
    vi.stubEnv("AI_RETRY_ATTEMPTS", "1");
    const f = fixture(); vi.stubGlobal("fetch", vi.fn(async () => Response.json(result, { headers: { "X-AI-Fallback-Reason": "provider_unavailable" } })));
    expect(await f.run()).toEqual({ ok: true, jobId: "job-a", status: "failed" });
    expect(f.admin.rpc).not.toHaveBeenCalledWith("complete_session_analysis_job", expect.anything());
  });
  it.each([301, 302, 303, 307, 308])("refuses HTTP %i without completing or retrying the job", async status => {
    const f = fixture();
    const cancel = vi.fn();
    const response = new Response(new ReadableStream({ cancel }), { status, headers: { Location: "https://foreign.test/collect" } });
    const fetchMock = vi.fn(async () => response); vi.stubGlobal("fetch", fetchMock);
    expect(await f.run()).toEqual({ ok: true, jobId: "job-a", status: "failed" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("https://safe.test/api/ai/analyze-image");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ redirect: "manual" });
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(f.admin.rpc).not.toHaveBeenCalledWith("complete_session_analysis_job", expect.anything());
    expect(f.admin.rpc).toHaveBeenCalledWith("fail_session_analysis_job", expect.objectContaining({ p_tenant_id: "tenant-a", p_execution_token: "claim-a" }));
  });
});
