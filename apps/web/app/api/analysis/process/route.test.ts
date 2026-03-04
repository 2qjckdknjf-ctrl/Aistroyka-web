import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "test-user" } } }),
    },
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn().mockReturnValue({}),
}));

const mockProcessOneJob = vi.fn();
vi.mock("@/lib/ai/runOneJob", () => ({ processOneJob: mockProcessOneJob }));

describe("POST /api/analysis/process", () => {
  it("returns 401 when user is not authenticated", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    } as never);
    const { POST } = await import("./route");
    const res = await POST(new Request("http://test/api/analysis/process", { method: "POST" }));
    expect(res.status).toBe(401);
    const data = (await res.json()) as { ok?: boolean; error?: string };
    expect(data.ok).toBe(false);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 503 when processOneJob returns no_url", async () => {
    mockProcessOneJob.mockResolvedValueOnce({ ok: false, reason: "no_url" });
    const { POST } = await import("./route");
    const res = await POST(new Request("http://test/api/analysis/process", { method: "POST" }));
    expect(res.status).toBe(503);
    const data = (await res.json()) as { ok?: boolean; error?: string };
    expect(data.error).toContain("AI_ANALYSIS_URL");
  });

  it("returns 200 with processed: false when no job available", async () => {
    mockProcessOneJob.mockResolvedValueOnce({ ok: false, reason: "no_job" });
    const { POST } = await import("./route");
    const res = await POST(new Request("http://test/api/analysis/process", { method: "POST" }));
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
    const res = await POST(new Request("http://test/api/analysis/process", { method: "POST" }));
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
    const res = await POST(new Request("http://test/api/analysis/process", { method: "POST" }));
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
    const res = await POST(new Request("http://test/api/analysis/process", { method: "POST" }));
    expect(res.status).toBe(200);
    const data = (await res.json()) as { ok?: boolean; processed?: boolean; status?: string };
    expect(data.ok).toBe(true);
    expect(data.processed).toBe(true);
    expect(data.status).toBe("failed");
  });
});
