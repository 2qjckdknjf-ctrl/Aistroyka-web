import { describe, expect, it, vi, beforeEach } from "vitest";

const getTenantContextFromRequest = vi.fn();
const mockProcessOneJob = vi.fn();

vi.mock("@/lib/tenant", () => {
  class TenantRequiredError extends Error {
    constructor(message = "Authentication required") {
      super(message);
      this.name = "TenantRequiredError";
    }
  }
  return {
    getTenantContextFromRequest: (...args: unknown[]) => getTenantContextFromRequest(...args),
    requireTenant: (ctx: { tenantId?: string | null }) => {
      if (!ctx.tenantId) throw new TenantRequiredError();
    },
    TenantRequiredError,
  };
});

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn().mockReturnValue({}),
}));

vi.mock("@/lib/ai/runOneJob", () => ({ processOneJob: (...args: unknown[]) => mockProcessOneJob(...args) }));

describe("POST /api/v1/analysis/process", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getTenantContextFromRequest.mockResolvedValue({
      tenantId: "tenant-a",
      userId: "user-1",
      role: "owner",
    });
  });

  it("returns 401 when user is not authenticated", async () => {
    getTenantContextFromRequest.mockResolvedValueOnce({
      tenantId: null,
      userId: null,
      role: null,
    });
    const { POST } = await import("./route");
    const res = await POST(new Request("http://test/api/v1/analysis/process", { method: "POST" }));
    expect(res.status).toBe(401);
    const data = (await res.json()) as { ok?: boolean; error?: string };
    expect(data.ok).toBe(false);
    expect(data.error).toBeDefined();
  });

  it("scopes processOneJob to the caller tenant", async () => {
    mockProcessOneJob.mockResolvedValueOnce({ ok: false, reason: "no_job" });
    const { POST } = await import("./route");
    await POST(new Request("http://test/api/v1/analysis/process", { method: "POST" }));
    expect(mockProcessOneJob).toHaveBeenCalledWith(
      expect.anything(),
      undefined,
      expect.objectContaining({ tenantId: "tenant-a" })
    );
  });

  it("returns 503 when processOneJob returns no_url", async () => {
    mockProcessOneJob.mockResolvedValueOnce({ ok: false, reason: "no_url" });
    const { POST } = await import("./route");
    const res = await POST(new Request("http://test/api/v1/analysis/process", { method: "POST" }));
    expect(res.status).toBe(503);
    const data = (await res.json()) as { ok?: boolean; error?: string };
    expect(data.error).toContain("AI_ANALYSIS_URL");
  });

  it("returns 200 with processed: false when no job available", async () => {
    mockProcessOneJob.mockResolvedValueOnce({ ok: false, reason: "no_job" });
    const { POST } = await import("./route");
    const res = await POST(new Request("http://test/api/v1/analysis/process", { method: "POST" }));
    expect(res.status).toBe(200);
    const data = (await res.json()) as { ok?: boolean; processed?: boolean };
    expect(data.ok).toBe(true);
    expect(data.processed).toBe(false);
  });

  it("returns 500 when processOneJob returns error", async () => {
    mockProcessOneJob.mockResolvedValueOnce({
      ok: false,
      reason: "error",
      message: "DB connection failed",
    });
    const { POST } = await import("./route");
    const res = await POST(new Request("http://test/api/v1/analysis/process", { method: "POST" }));
    expect(res.status).toBe(500);
    const data = (await res.json()) as { ok?: boolean; error?: string };
    expect(data.error).toBe("DB connection failed");
  });

  it("returns 200 with processed: true and jobId when job completed", async () => {
    mockProcessOneJob.mockResolvedValueOnce({
      ok: true,
      jobId: "job-123",
      status: "completed",
    });
    const { POST } = await import("./route");
    const res = await POST(new Request("http://test/api/v1/analysis/process", { method: "POST" }));
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      ok?: boolean;
      processed?: boolean;
      jobId?: string;
      status?: string;
    };
    expect(data.ok).toBe(true);
    expect(data.processed).toBe(true);
    expect(data.jobId).toBe("job-123");
    expect(data.status).toBe("completed");
  });

  it("returns 200 with processed: true and status failed when job failed", async () => {
    mockProcessOneJob.mockResolvedValueOnce({
      ok: true,
      jobId: "job-456",
      status: "failed",
    });
    const { POST } = await import("./route");
    const res = await POST(new Request("http://test/api/v1/analysis/process", { method: "POST" }));
    expect(res.status).toBe(200);
    const data = (await res.json()) as { ok?: boolean; processed?: boolean; status?: string };
    expect(data.ok).toBe(true);
    expect(data.processed).toBe(true);
    expect(data.status).toBe("failed");
  });
});
