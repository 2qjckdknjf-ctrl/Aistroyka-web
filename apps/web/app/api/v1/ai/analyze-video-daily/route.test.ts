import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { POST } from "./route";
import * as aiService from "@/lib/platform/ai/ai.service";

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn().mockResolvedValue({ from: vi.fn() }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn(() => ({})),
}));

vi.mock("@/lib/platform/rate-limit/rate-limit.service", () => ({
  checkRateLimitStrict: vi.fn().mockResolvedValue({ ok: true }),
  resolveTrustedClientIp: () => ({ trustedIp: null, source: "none", reason: "trust_flag_off" }),
  rateLimitUnavailableResponse: (message = "Rate limit service unavailable.") =>
    NextResponse.json({ error: message, code: "rate_limit_unavailable" }, { status: 503 }),
}));

vi.mock("@/lib/platform/ai-usage/ai-usage.service", () => ({
  checkQuota: vi.fn().mockResolvedValue(null),
  checkBudgetAlert: vi.fn().mockResolvedValue(undefined),
  estimateGeminiVideoDailyQuotaReserveUsd: vi.fn(() => 0.75),
}));

vi.mock("@/lib/observability/audit.service", () => ({
  emitAiRuntimeAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/platform/ai/safe-remote-media", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/platform/ai/safe-remote-media")>();
  return {
    ...mod,
    assertSafeRemoteMediaUrl: vi.fn(async (url: string) => new URL(url)),
  };
});

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
    getTenantContextFromRequest: vi.fn().mockResolvedValue({
      tenantId: "t1",
      userId: "u1",
      subscriptionTier: "pro",
    }),
    requireTenant: (ctx: { tenantId?: string | null }) => {
      if (!ctx.tenantId) throw new TenantRequiredError("Authentication required");
    },
    TenantRequiredError,
    LitePathForbiddenError,
  };
});

function jsonRequest(body: object) {
  return new Request("http://test/api/v1/ai/analyze-video-daily", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/v1/ai/analyze-video-daily", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 503 when Gemini is not configured", async () => {
    vi.stubEnv("GOOGLE_AI_API_KEY", "");
    vi.stubEnv("GEMINI_API_KEY", "");
    const req = jsonRequest({ video_url: "https://example.com/a.mp4" });
    const res = await POST(req);
    expect(res.status).toBe(503);
    vi.unstubAllEnvs();
  });

  it("returns 400 when video_url is missing", async () => {
    vi.stubEnv("GOOGLE_AI_API_KEY", "x");
    const req = jsonRequest({});
    const res = await POST(req);
    expect(res.status).toBe(400);
    vi.unstubAllEnvs();
  });

  it("returns 200 with payload when analysis succeeds", async () => {
    vi.stubEnv("GOOGLE_AI_API_KEY", "sk-test");
    vi.spyOn(aiService, "analyzeVideoDailyWork").mockResolvedValueOnce({
      work_date: "2026-04-27",
      summary: "Concrete pour completed in zone A.",
      activities_observed: ["Concrete pour zone A"],
      completion_estimate_percent: 42,
      risk_level: "low",
      issues_and_risks: [],
      recommendations: ["Cure concrete per spec"],
    });
    const req = jsonRequest({
      video_url: "https://example.com/site.mp4",
      work_date: "2026-04-27",
      project_id: "550e8400-e29b-41d4-a716-446655440000",
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { summary: string; work_date: string };
    expect(data.summary).toContain("Concrete");
    expect(data.work_date).toBe("2026-04-27");
    vi.unstubAllEnvs();
  });
});
