import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const tenantMocks = vi.hoisted(() => {
  class TenantRequiredError extends Error {}
  return {
    TenantRequiredError,
    getTenantContextFromRequest: vi.fn(),
    requireTenant: vi.fn(),
  };
});

const projectMocks = vi.hoisted(() => ({
  getProjectForInternalWorkspace: vi.fn(),
}));

const aiMocks = vi.hoisted(() => {
  class AIPolicyBlockedError extends Error {}
  class AIVideoDailyFailedError extends Error {}
  return {
    AIPolicyBlockedError,
    AIVideoDailyFailedError,
    analyzeVideoDailyWork: vi.fn(),
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn().mockResolvedValue({ from: vi.fn() }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn(() => ({})),
}));

vi.mock("@/lib/platform/rate-limit/rate-limit.service", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ limited: false }),
}));

vi.mock("@/lib/platform/ai-usage/ai-usage.service", () => ({
  checkQuota: vi.fn().mockResolvedValue(null),
  checkBudgetAlert: vi.fn().mockResolvedValue(undefined),
  estimateGeminiVideoDailyQuotaReserveUsd: vi.fn(() => 0.75),
}));

vi.mock("@/lib/observability/audit.service", () => ({
  emitAiRuntimeAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/observability", () => ({
  logStructured: vi.fn(),
  getOrCreateRequestId: vi.fn().mockReturnValue("req-video-1"),
  withRequestIdAndTiming: vi.fn((_req: Request, res: Response) => res),
}));

vi.mock("@/lib/observability/ai-telemetry", () => ({
  logVisionAnalyzeComplete: vi.fn(),
  logVisionAnalyzeError: vi.fn(),
  getAiReleaseCorrelation: vi.fn().mockReturnValue({}),
}));

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: (...args: unknown[]) => tenantMocks.getTenantContextFromRequest(...args),
  requireTenant: (...args: unknown[]) => tenantMocks.requireTenant(...args),
  TenantRequiredError: tenantMocks.TenantRequiredError,
}));

vi.mock("@/lib/domain/projects/project.service", () => ({
  getProjectForInternalWorkspace: (...args: unknown[]) =>
    projectMocks.getProjectForInternalWorkspace(...args),
}));

vi.mock("@/lib/platform/ai/ai.service", () => ({
  analyzeVideoDailyWork: (...args: unknown[]) => aiMocks.analyzeVideoDailyWork(...args),
  AIPolicyBlockedError: aiMocks.AIPolicyBlockedError,
  AIVideoDailyFailedError: aiMocks.AIVideoDailyFailedError,
}));

const validTenant = {
  tenantId: "t1",
  userId: "u1",
  role: "member",
  subscriptionTier: "pro",
  clientProfile: "web",
  traceId: "trace-1",
};

const absentTenant = {
  tenantId: null,
  userId: null,
  role: null,
  subscriptionTier: null,
  clientProfile: "web",
  traceId: "trace-1",
};

const validAnalysis = {
  work_date: "2026-04-27",
  summary: "Concrete pour completed in zone A.",
  activities_observed: ["Concrete pour zone A"],
  completion_estimate_percent: 42,
  risk_level: "low",
  issues_and_risks: [],
  recommendations: ["Cure concrete per spec"],
};

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
    vi.unstubAllEnvs();
    tenantMocks.getTenantContextFromRequest.mockResolvedValue(validTenant);
    tenantMocks.requireTenant.mockImplementation(() => undefined);
    projectMocks.getProjectForInternalWorkspace.mockResolvedValue({
      data: { id: "550e8400-e29b-41d4-a716-446655440000", name: "Project" },
      error: null,
    });
    aiMocks.analyzeVideoDailyWork.mockResolvedValue(validAnalysis);
  });

  it("returns 503 when Gemini is not configured", async () => {
    vi.stubEnv("GOOGLE_AI_API_KEY", "");
    vi.stubEnv("GEMINI_API_KEY", "");
    const req = jsonRequest({ video_url: "https://example.com/a.mp4" });
    const res = await POST(req);
    expect(res.status).toBe(503);
  });

  it("returns 400 when video_url is missing", async () => {
    vi.stubEnv("GOOGLE_AI_API_KEY", "x");
    const req = jsonRequest({});
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 401 before project lookup or AI when project_id is supplied without tenant auth", async () => {
    vi.stubEnv("GOOGLE_AI_API_KEY", "x");
    tenantMocks.getTenantContextFromRequest.mockResolvedValueOnce(absentTenant);
    tenantMocks.requireTenant.mockImplementationOnce(() => {
      throw new tenantMocks.TenantRequiredError("Tenant required");
    });

    const res = await POST(
      jsonRequest({
        video_url: "https://example.com/site.mp4",
        project_id: "550e8400-e29b-41d4-a716-446655440000",
      })
    );

    expect(res.status).toBe(401);
    expect(projectMocks.getProjectForInternalWorkspace).not.toHaveBeenCalled();
    expect(aiMocks.analyzeVideoDailyWork).not.toHaveBeenCalled();
  });

  it("returns 403 before AI when project is outside tenant rights", async () => {
    vi.stubEnv("GOOGLE_AI_API_KEY", "x");
    projectMocks.getProjectForInternalWorkspace.mockResolvedValueOnce({
      data: null,
      error: "Insufficient rights",
    });

    const res = await POST(
      jsonRequest({
        video_url: "https://example.com/site.mp4",
        project_id: "550e8400-e29b-41d4-a716-446655440001",
      })
    );

    expect(res.status).toBe(403);
    expect(aiMocks.analyzeVideoDailyWork).not.toHaveBeenCalled();
  });

  it("returns 404 before AI when scoped project is not found", async () => {
    vi.stubEnv("GOOGLE_AI_API_KEY", "x");
    projectMocks.getProjectForInternalWorkspace.mockResolvedValueOnce({ data: null, error: null });

    const res = await POST(
      jsonRequest({
        video_url: "https://example.com/site.mp4",
        project_id: "550e8400-e29b-41d4-a716-446655440002",
      })
    );

    expect(res.status).toBe(404);
    expect(aiMocks.analyzeVideoDailyWork).not.toHaveBeenCalled();
  });

  it("returns 200 only after authorized project access and passes the normalized project id", async () => {
    vi.stubEnv("GOOGLE_AI_API_KEY", "sk-test");
    const req = jsonRequest({
      video_url: "https://example.com/site.mp4",
      work_date: "2026-04-27",
      project_id: "  550e8400-e29b-41d4-a716-446655440000  ",
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(projectMocks.getProjectForInternalWorkspace).toHaveBeenCalledWith(
      expect.anything(),
      validTenant,
      "550e8400-e29b-41d4-a716-446655440000"
    );
    expect(aiMocks.analyzeVideoDailyWork).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ tenantId: "t1", userId: "u1" }),
      expect.objectContaining({
        projectId: "550e8400-e29b-41d4-a716-446655440000",
        workDate: "2026-04-27",
      })
    );
    const data = (await res.json()) as { summary: string; work_date: string };
    expect(data.summary).toContain("Concrete");
    expect(data.work_date).toBe("2026-04-27");
  });

  it("preserves unscoped video analysis without forcing tenant auth", async () => {
    vi.stubEnv("GOOGLE_AI_API_KEY", "x");
    tenantMocks.getTenantContextFromRequest.mockResolvedValueOnce(absentTenant);

    const res = await POST(jsonRequest({ video_url: "https://example.com/site.mp4" }));

    expect(res.status).toBe(200);
    expect(tenantMocks.requireTenant).not.toHaveBeenCalled();
    expect(projectMocks.getProjectForInternalWorkspace).not.toHaveBeenCalled();
    expect(aiMocks.analyzeVideoDailyWork).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ tenantId: null, userId: null }),
      expect.objectContaining({ projectId: null })
    );
  });
});
