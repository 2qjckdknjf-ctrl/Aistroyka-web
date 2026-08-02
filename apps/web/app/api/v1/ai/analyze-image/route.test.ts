import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { POST } from "./route";

const getTenantContextFromRequest = vi.fn();
const getProjectForInternalWorkspace = vi.fn();
const analyzeImage = vi.fn();
const checkRateLimitStrict = vi.fn();
const checkQuota = vi.fn();
const getAdminClient = vi.fn();

vi.mock("@/lib/tenant", () => {
  class TenantRequiredError extends Error {
    constructor(message = "Tenant context required") {
      super(message);
      this.name = "TenantRequiredError";
    }
  }
  class LitePathForbiddenError extends Error {
    code = "lite_client_path_forbidden";
    constructor(message = "forbidden") {
      super(message);
      this.name = "LitePathForbiddenError";
    }
  }
  return {
    getTenantContextFromRequest: (...args: unknown[]) => getTenantContextFromRequest(...args),
    requireTenant: (ctx: { tenantId?: string | null }) => {
      if (!ctx.tenantId) throw new TenantRequiredError("Authentication required");
    },
    TenantRequiredError,
    LitePathForbiddenError,
  };
});

vi.mock("@/lib/domain/projects/project.service", () => ({
  getProjectForInternalWorkspace: (...args: unknown[]) => getProjectForInternalWorkspace(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: (...args: unknown[]) => getAdminClient(...args),
}));

vi.mock("@/lib/platform/rate-limit/rate-limit.service", () => ({
  checkRateLimitStrict: (...args: unknown[]) => checkRateLimitStrict(...args),
  resolveTrustedClientIp: () => ({ trustedIp: null, source: "none", reason: "trust_flag_off" }),
  rateLimitUnavailableResponse: (message = "Rate limit service unavailable.") =>
    NextResponse.json({ error: message, code: "rate_limit_unavailable" }, { status: 503 }),
}));

vi.mock("@/lib/platform/ai-usage/ai-usage.service", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/platform/ai-usage/ai-usage.service")>();
  return {
    ...mod,
    checkQuota: (...args: unknown[]) => checkQuota(...args),
    checkBudgetAlert: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("@/lib/platform/ai/ai.service", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/platform/ai/ai.service")>();
  return {
    ...mod,
    analyzeImage: (...args: unknown[]) => analyzeImage(...args),
  };
});

vi.mock("@/lib/platform/ai/safe-remote-media", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/platform/ai/safe-remote-media")>();
  return {
    ...mod,
    assertSafeRemoteMediaUrl: vi.fn(async (url: string) => new URL(url)),
  };
});

vi.mock("@/lib/observability/audit.service", () => ({
  emitAiRuntimeAudit: vi.fn().mockResolvedValue(undefined),
}));

function jsonRequest(body: object) {
  return new Request("http://test/api/v1/ai/analyze-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const authedTenant = {
  tenantId: "tenant-a",
  userId: "user-1",
  subscriptionTier: "free",
  role: "manager",
};

describe("POST /api/v1/ai/analyze-image", () => {
  beforeEach(() => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    getTenantContextFromRequest.mockResolvedValue({
      tenantId: null,
      userId: null,
      subscriptionTier: "free",
    });
    getProjectForInternalWorkspace.mockResolvedValue({ data: { id: "p1" }, error: null });
    getAdminClient.mockReturnValue({});
    checkRateLimitStrict.mockResolvedValue({ ok: true });
    checkQuota.mockResolvedValue(null);
    analyzeImage.mockReset();
  });

  it("returns 401 for anonymous caller before provider disclosure", async () => {
    const res = await POST(jsonRequest({ image_url: "https://example.com/photo.jpg" }));
    expect(res.status).toBe(401);
    expect(analyzeImage).not.toHaveBeenCalled();
  });

  it("does not open anonymous paid path when project_id omitted", async () => {
    const res = await POST(jsonRequest({ image_url: "https://example.com/photo.jpg" }));
    expect(res.status).toBe(401);
    expect(analyzeImage).not.toHaveBeenCalled();
    expect(checkRateLimitStrict).not.toHaveBeenCalled();
  });

  it("returns 403 when project_id is outside tenant rights", async () => {
    getTenantContextFromRequest.mockResolvedValueOnce(authedTenant);
    getProjectForInternalWorkspace.mockResolvedValueOnce({
      data: null,
      error: "Insufficient rights",
    });

    const res = await POST(
      jsonRequest({
        image_url: "https://example.com/photo.jpg",
        project_id: "other-tenant-project",
      })
    );
    expect(res.status).toBe(403);
    expect(analyzeImage).not.toHaveBeenCalled();
  });

  it("returns 503 when no vision provider is configured (after auth)", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("GOOGLE_AI_API_KEY", "");
    vi.stubEnv("GEMINI_API_KEY", "");
    getTenantContextFromRequest.mockResolvedValueOnce(authedTenant);
    const res = await POST(jsonRequest({ image_url: "https://example.com/photo.jpg" }));
    expect(res.status).toBe(503);
    const data = (await res.json()) as { error?: string };
    expect(data.error).toContain("No AI vision provider is configured");
    expect(analyzeImage).not.toHaveBeenCalled();
  });

  it("fails closed for paid providers when rate limit store is unavailable (deterministic fallback only)", async () => {
    vi.stubEnv("AI_VISION_DETERMINISTIC_FALLBACK", "true");
    getTenantContextFromRequest.mockResolvedValueOnce(authedTenant);
    checkRateLimitStrict.mockResolvedValueOnce({
      ok: false,
      kind: "unavailable",
      message: "Rate limit service unavailable.",
    });
    const res = await POST(jsonRequest({ image_url: "https://example.com/photo.jpg" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("X-AI-Fallback-Reason")).toBe("rate_limit_unavailable");
    expect(analyzeImage).not.toHaveBeenCalled();
  });

  it("returns 503 when rate limit store unavailable and deterministic fallback disabled", async () => {
    vi.stubEnv("AI_VISION_DETERMINISTIC_FALLBACK", "false");
    getTenantContextFromRequest.mockResolvedValueOnce(authedTenant);
    checkRateLimitStrict.mockResolvedValueOnce({
      ok: false,
      kind: "unavailable",
      message: "Rate limit service unavailable.",
    });
    const res = await POST(jsonRequest({ image_url: "https://example.com/photo.jpg" }));
    expect(res.status).toBe(503);
    expect(analyzeImage).not.toHaveBeenCalled();
  });

  it("returns 402 when quota exceeded before provider call", async () => {
    getTenantContextFromRequest.mockResolvedValueOnce(authedTenant);
    checkQuota.mockResolvedValueOnce("AI budget exceeded");
    const res = await POST(jsonRequest({ image_url: "https://example.com/photo.jpg" }));
    expect(res.status).toBe(402);
    expect(analyzeImage).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid JSON body", async () => {
    const req = new Request("http://test/api/v1/ai/analyze-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when image_url is missing", async () => {
    const res = await POST(jsonRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 413 when content-length exceeds limit", async () => {
    const req = new Request("http://test/api/v1/ai/analyze-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": "200000",
      },
      body: JSON.stringify({ image_url: "https://example.com/photo.jpg" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(413);
  });

  it("does not set legacy Deprecation headers on v1 route", async () => {
    getTenantContextFromRequest.mockResolvedValueOnce(authedTenant);
    vi.stubEnv("OPENAI_API_KEY", "");
    const res = await POST(jsonRequest({ image_url: "https://example.com/photo.jpg" }));
    expect(res.headers.get("Deprecation")).toBeNull();
    expect(res.headers.get("Sunset")).toBeNull();
  });
});
