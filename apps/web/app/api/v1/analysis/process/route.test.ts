import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetTenantContext = vi.fn();
const mockRequireTenant = vi.fn();
const mockAuthorize = vi.fn();

vi.mock("@/lib/tenant", async () => {
  const actual = await vi.importActual<typeof import("@/lib/tenant")>("@/lib/tenant");
  return {
    ...actual,
    getTenantContextFromRequest: (...args: unknown[]) => mockGetTenantContext(...args),
    requireTenant: (...args: unknown[]) => mockRequireTenant(...args),
    authorize: (...args: unknown[]) => mockAuthorize(...args),
  };
});

const mockGetAdminClient = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: (...args: unknown[]) => mockGetAdminClient(...args),
}));

const mockProcessOneJob = vi.fn();
vi.mock("@/lib/ai/runOneJob", () => ({
  processOneJob: (...args: unknown[]) => mockProcessOneJob(...args),
}));

const mockCheckRateLimit = vi.fn();
vi.mock("@/lib/platform/rate-limit/rate-limit.service", () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
  HIGH_RISK_ENDPOINTS: [],
}));

vi.mock("@/lib/config/server", () => ({
  getServerConfig: () => ({ AI_ANALYSIS_URL: "https://ai.example/analyze", NODE_ENV: "test" }),
}));

import { TenantForbiddenError, TenantRequiredError } from "@/lib/tenant";

function baseCtx(overrides: Record<string, unknown> = {}) {
  return {
    tenantId: "tenant-1",
    userId: "user-1",
    role: "member",
    subscriptionTier: "free",
    clientProfile: "web",
    traceId: "trace-1",
    ...overrides,
  };
}

describe("POST /api/v1/analysis/process", () => {
  beforeEach(() => {
    vi.resetModules();
    mockGetTenantContext.mockReset();
    mockRequireTenant.mockReset();
    mockAuthorize.mockReset();
    mockGetAdminClient.mockReset();
    mockProcessOneJob.mockReset();
    mockCheckRateLimit.mockReset();

    mockGetTenantContext.mockResolvedValue(baseCtx());
    mockRequireTenant.mockImplementation((ctx: unknown) => {
      if (!(ctx as { tenantId?: string | null }).tenantId) {
        throw new TenantRequiredError("Authentication required");
      }
    });
    mockAuthorize.mockReturnValue(true);
    mockGetAdminClient.mockReturnValue({ admin: true });
    mockCheckRateLimit.mockResolvedValue({ limited: false });
    mockProcessOneJob.mockResolvedValue({ ok: true, jobId: "job-1", status: "completed" });
  });

  async function post(headers: Record<string, string> = {}) {
    const { POST } = await import("./route");
    return POST(
      new Request("http://test/api/v1/analysis/process", {
        method: "POST",
        headers: { "x-request-id": "req-v1-1", ...headers },
      })
    );
  }

  it("returns 401 when unauthenticated", async () => {
    mockGetTenantContext.mockResolvedValue({
      tenantId: null,
      userId: null,
      role: null,
      subscriptionTier: null,
      clientProfile: "web",
      traceId: "t",
    });
    mockRequireTenant.mockImplementation(() => {
      throw new TenantRequiredError("Authentication required");
    });
    const res = await post();
    expect(res.status).toBe(401);
    expect(res.headers.get("Deprecation")).toBeNull();
  });

  it("returns 403 when authenticated without tenant membership", async () => {
    mockGetTenantContext.mockResolvedValue({
      tenantId: null,
      userId: "user-1",
      role: null,
      subscriptionTier: null,
      clientProfile: "web",
      traceId: "t",
    });
    mockRequireTenant.mockImplementation(() => {
      throw new TenantRequiredError("User has no tenant membership");
    });
    const res = await post();
    expect(res.status).toBe(403);
  });

  it("returns 403 when service-role JWT is used", async () => {
    mockGetTenantContext.mockRejectedValue(new TenantForbiddenError());
    const res = await post();
    expect(res.status).toBe(403);
  });

  it("returns 403 for stakeholder", async () => {
    mockGetTenantContext.mockResolvedValue(baseCtx({ role: "stakeholder" }));
    mockAuthorize.mockReturnValue(false);
    const res = await post();
    expect(res.status).toBe(403);
  });

  it("returns 403 for viewer", async () => {
    mockGetTenantContext.mockResolvedValue(baseCtx({ role: "viewer" }));
    mockAuthorize.mockReturnValue(false);
    const res = await post();
    expect(res.status).toBe(403);
  });

  it.each(["member", "admin", "owner"] as const)("allows %s and passes exact tenantId", async (role) => {
    mockGetTenantContext.mockResolvedValue(baseCtx({ role, tenantId: "tenant-v1" }));
    mockAuthorize.mockReturnValue(true);
    const res = await post();
    expect(res.status).toBe(200);
    expect(mockProcessOneJob).toHaveBeenCalledWith(
      expect.anything(),
      "https://ai.example/analyze",
      expect.objectContaining({ tenantId: "tenant-v1", traceId: "req-v1-1" })
    );
  });

  it.each(["ios_lite", "android_lite", "ios_worker", "android_worker"] as const)(
    "denies lite/worker client %s",
    async (clientProfile) => {
      mockGetTenantContext.mockResolvedValue(baseCtx({ clientProfile }));
      const res = await post({ "x-client": clientProfile });
      expect(res.status).toBe(403);
      expect(mockProcessOneJob).not.toHaveBeenCalled();
    }
  );

  it("returns 429 when rate limited", async () => {
    mockCheckRateLimit.mockResolvedValue({ limited: true, message: "Too many requests from this IP." });
    const res = await post();
    expect(res.status).toBe(429);
    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenantId: "tenant-1",
        endpoint: "/api/v1/analysis/process",
      })
    );
  });

  it("returns 503 when admin client missing", async () => {
    mockGetAdminClient.mockReturnValue(null);
    const res = await post();
    expect(res.status).toBe(503);
  });

  it("returns 503 when processOneJob returns no_url", async () => {
    mockProcessOneJob.mockResolvedValue({ ok: false, reason: "no_url" });
    const res = await post();
    expect(res.status).toBe(503);
  });

  it("returns 200 processed false when no job", async () => {
    mockProcessOneJob.mockResolvedValue({ ok: false, reason: "no_job" });
    const res = await post();
    expect(res.status).toBe(200);
    const data = (await res.json()) as { processed?: boolean };
    expect(data.processed).toBe(false);
  });

  it("returns sanitized 500 on processing error", async () => {
    mockProcessOneJob.mockResolvedValue({
      ok: false,
      reason: "error",
      message: "foreign media uuid",
    });
    const res = await post();
    expect(res.status).toBe(500);
    const data = (await res.json()) as { error?: string };
    expect(data.error).toBe("Processing failed");
  });

  it("does not set legacy deprecation headers on v1", async () => {
    const res = await post();
    expect(res.status).toBe(200);
    expect(res.headers.get("Deprecation")).toBeNull();
  });

  it("returns 200 with jobId when completed", async () => {
    mockProcessOneJob.mockResolvedValue({ ok: true, jobId: "job-123", status: "completed" });
    const res = await post();
    expect(res.status).toBe(200);
    const data = (await res.json()) as { ok?: boolean; processed?: boolean; jobId?: string };
    expect(data.ok).toBe(true);
    expect(data.processed).toBe(true);
    expect(data.jobId).toBe("job-123");
  });
});
