import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { processOneJob } from "./runOneJob";
import { AIVisionFailedError } from "@/lib/platform/ai/ai.service";
import { AI_ERROR_CODES } from "@/lib/platform/ai/ai-media-errors";
import { mapAnalysisJobToLifecycle } from "@/lib/domain/vision-jobs/vision-job-lifecycle";

const mocks = vi.hoisted(() => ({
  rate: vi.fn(), quota: vi.fn(), alert: vi.fn(), image: vi.fn(), video: vi.fn(),
  estimateImage: vi.fn(), estimateVideo: vi.fn(),
}));
vi.mock("@/lib/platform/rate-limit/rate-limit.service", () => ({ checkRateLimit: mocks.rate }));
vi.mock("@/lib/platform/ai-usage/ai-usage.service", async (original) => ({
  ...await original<typeof import("@/lib/platform/ai-usage/ai-usage.service")>(),
  checkQuota: mocks.quota, checkBudgetAlert: mocks.alert,
  estimateMaxVisionCostUsd: mocks.estimateImage,
  estimateGeminiVideoDailyQuotaReserveUsd: mocks.estimateVideo,
}));
vi.mock("@/lib/config/server", async (original) => ({
  ...await original<typeof import("@/lib/config/server")>(),
  isAnyVisionProviderConfigured: () => true,
  isGeminiConfigured: () => true,
  getConfiguredVisionProviders: () => ["openai", "anthropic"],
}));
vi.mock("@/lib/platform/ai/ai.service", async (original) => ({
  ...await original<typeof import("@/lib/platform/ai/ai.service")>(),
  analyzeImage: mocks.image, analyzeVideoDailyWork: mocks.video,
}));
vi.mock("@/lib/platform/ai/resolve-ai-media-image", () => ({
  resolveAIMediaImage: vi.fn(async () => ({
    ok: true, imageUrl: "https://storage.test/private-signed?token=synthetic",
    trustedProjectId: "project-a", objectPath: "project-a/source", source: "media",
  })),
}));

const imageResult = {
  stage: "structure", completion_percent: 20, risk_level: "low",
  detected_issues: [], recommendations: [],
};
const localUrl = "https://staging.aistroyka.ai/api/v1/ai/analyze-image";

function fixture(type: "image" | "video" = "image") {
  const read = {
    select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), is: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(),
    limit: vi.fn(async () => ({ data: [{ id: "job-a", media_id: "media-a", tenant_id: "tenant-a" }], error: null })),
  };
  const claim = {
    update: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), is: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(async () => ({
      data: { id: "job-a", media_id: "media-a", tenant_id: "tenant-a", execution_token: "claim-a" }, error: null,
    })),
  };
  const media = {
    select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
    single: vi.fn(async () => ({
      data: { tenant_id: "tenant-a", project_id: "project-a", file_url: "project-a/source", type }, error: null,
    })),
  };
  const caller = { from: vi.fn(() => read) };
  const admin = {
    from: vi.fn((table: string) => table === "analysis_jobs" ? claim : media),
    rpc: vi.fn(async (_name: string, _params: Record<string, unknown>) => ({ data: 1, error: null })),
  };
  const options = {
    tenantId: "tenant-a", callerClient: caller as unknown as SupabaseClient,
    userId: "user-a", subscriptionTier: "pro", requestIp: "192.0.2.10", traceId: "trace-a",
  };
  return {
    admin,
    run: (url: string | undefined = localUrl) => processOneJob(admin as unknown as SupabaseClient, url, options),
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://staging.aistroyka.ai");
  mocks.rate.mockResolvedValue({ limited: false });
  mocks.quota.mockResolvedValue(null);
  mocks.alert.mockResolvedValue(undefined);
  mocks.estimateImage.mockReturnValue(0.01);
  mocks.estimateVideo.mockReturnValue(0.75);
  mocks.image.mockResolvedValue(imageResult);
  mocks.video.mockResolvedValue({
    work_date: "2026-11-26", summary: "Site video", activities_observed: [],
    completion_estimate_percent: 20, risk_level: "low", issues_and_risks: [], recommendations: [],
  });
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("session analysis provider limits", () => {
  it.each([localUrl, "https://staging.aistroyka.ai/api/ai/analyze-image", ""])(
    "blocks over-budget image jobs before in-process egress (%s)", async (url) => {
      const f = fixture();
      mocks.quota.mockResolvedValue("AI budget exceeded for this period.");
      expect(await f.run(url)).toMatchObject({ status: "failed" });
      expect(mocks.quota).toHaveBeenCalledWith(f.admin, "tenant-a", 0.01);
      expect(mocks.image).not.toHaveBeenCalled();
      expect(mocks.alert).not.toHaveBeenCalled();
      expect(f.admin.rpc).toHaveBeenCalledWith("fail_session_analysis_job", expect.objectContaining({
        p_tenant_id: "tenant-a", p_execution_token: "claim-a", p_error_type: "invalid_request",
      }));
    }
  );

  it("applies the video route's quota estimate before Gemini egress", async () => {
    const f = fixture("video");
    mocks.quota.mockResolvedValue("AI budget exceeded for this period.");
    expect(await f.run()).toMatchObject({ status: "failed" });
    expect(mocks.estimateVideo).toHaveBeenCalledWith("pro");
    expect(mocks.quota).toHaveBeenCalledWith(f.admin, "tenant-a", 0.75);
    expect(mocks.video).not.toHaveBeenCalled();
  });

  it.each(["image", "video"] as const)("honors shared %s rate limits before provider calls", async (type) => {
    const f = fixture(type);
    mocks.rate.mockResolvedValue({ limited: true, message: "Tenant rate limit exceeded." });
    expect(await f.run()).toMatchObject({ status: "failed" });
    expect(mocks.rate).toHaveBeenCalledWith(f.admin, {
      tenantId: "tenant-a", ip: "192.0.2.10",
      endpoint: type === "image" ? "POST /api/v1/ai/analyze-image" : "POST /api/v1/ai/analyze-video-daily",
    });
    expect(mocks.image).not.toHaveBeenCalled();
    expect(mocks.video).not.toHaveBeenCalled();
    expect(mocks.quota).not.toHaveBeenCalled();
    expect(f.admin.rpc).toHaveBeenCalledWith("fail_session_analysis_job", expect.objectContaining({ p_error_type: "provider_unavailable" }));
  });

  it.each(["image", "video"] as const)("keeps authenticated context and budget alerts for allowed %s jobs", async (type) => {
    const f = fixture(type);
    expect(await f.run()).toMatchObject({ status: "completed" });
    expect(mocks.alert).toHaveBeenCalledWith(f.admin, "tenant-a", type === "image" ? 0.01 : 0.75);
    expect(type === "image" ? mocks.image : mocks.video).toHaveBeenCalledWith(f.admin, {
      tenantId: "tenant-a", userId: "user-a", subscriptionTier: "pro", traceId: "trace-a",
    }, expect.objectContaining({ mediaId: "media-a", projectId: "project-a" }));
    expect(f.admin.rpc).toHaveBeenCalledWith("complete_session_analysis_job", expect.objectContaining({
      p_tenant_id: "tenant-a", p_execution_token: "claim-a",
    }));
  });

  it("does not call a provider when quota validation throws", async () => {
    const f = fixture();
    mocks.quota.mockRejectedValue(new Error("Synthetic quota lookup failure"));
    expect(await f.run()).toMatchObject({ status: "failed" });
    expect(mocks.image).not.toHaveBeenCalled();
  });

  it("leaves the external HTTP path responsible for its own limits", async () => {
    const f = fixture();
    const fetchMock = vi.fn(async () => Response.json(imageResult));
    vi.stubGlobal("fetch", fetchMock);
    expect(await f.run("https://external.test/analyze")).toMatchObject({ status: "completed" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(mocks.rate).not.toHaveBeenCalled();
    expect(mocks.quota).not.toHaveBeenCalled();
    expect(mocks.image).not.toHaveBeenCalled();
  });

  it.each([
    AI_ERROR_CODES.AI_PROVIDER_INVALID_RESPONSE,
    AI_ERROR_CODES.AI_PROVIDER_AUTH_ERROR,
    AI_ERROR_CODES.AI_PROVIDER_FAILED,
    AI_ERROR_CODES.AI_PROVIDER_NOT_CONFIGURED,
  ])("classifies %s as a provider failure with bounded job retries", async (code) => {
    const f = fixture();
    mocks.image.mockRejectedValue(new AIVisionFailedError("Synthetic provider failure", code, false));
    expect(await f.run()).toMatchObject({ status: "failed" });
    const failure = f.admin.rpc.mock.calls.find(call => call[0] === "fail_session_analysis_job")?.[1];
    expect(failure).toMatchObject({ p_error_type: "provider_unavailable" });
    expect(mapAnalysisJobToLifecycle({ status: "failed", error_type: String(failure?.p_error_type), attempts: 1 })).toBe("FAILED_RETRYABLE");
    expect(mapAnalysisJobToLifecycle({ status: "failed", error_type: String(failure?.p_error_type), attempts: 3 })).toBe("FAILED_FINAL");
    expect(f.admin.rpc).not.toHaveBeenCalledWith("complete_session_analysis_job", expect.anything());
  });
});
