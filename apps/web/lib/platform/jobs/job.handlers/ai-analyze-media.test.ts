import { describe, expect, it, vi, beforeEach } from "vitest";
import { handleAiAnalyzeMedia } from "./ai-analyze-media";
import { JobPayloadError } from "../job.errors";
import type { Job } from "../job.types";
import { AI_ERROR_CODES } from "@/lib/platform/ai/ai-media-errors";

vi.mock("./resolve-image-url", () => ({
  resolveImageUrlDetailed: vi.fn(),
}));

vi.mock("@/lib/platform/subscription/subscription.service", () => ({
  getTierForTenant: vi.fn().mockResolvedValue("free"),
}));

vi.mock("@/lib/platform/ai/ai.service", () => {
  class AIPolicyBlockedError extends Error {
    constructor(message?: string) {
      super(message);
      this.name = "AIPolicyBlockedError";
    }
  }
  class AIVisionFailedError extends Error {
    code: string;
    retryable: boolean;
    constructor(message: string, code: string, retryable: boolean) {
      super(message);
      this.name = "AIVisionFailedError";
      this.code = code;
      this.retryable = retryable;
    }
  }
  return {
    analyzeImage: vi.fn().mockResolvedValue({}),
    AIPolicyBlockedError,
    AIVisionFailedError,
  };
});

const tenantA = "11111111-1111-4111-8111-111111111111";
const foreignProject = "66666666-6666-4666-8666-666666666666";

function makeJob(payload: Record<string, unknown>, tenantId = tenantA): Job {
  return {
    id: "job-1",
    tenant_id: tenantId,
    user_id: "user-1",
    type: "ai_analyze_media",
    status: "queued",
    payload: payload as Job["payload"],
    attempts: 0,
    max_attempts: 5,
    run_after: new Date().toISOString(),
    locked_by: null,
    locked_at: null,
    dedupe_key: null,
    trace_id: null,
    last_error: null,
    last_error_type: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

describe("handleAiAnalyzeMedia", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws JobPayloadError when report_id missing", async () => {
    await expect(handleAiAnalyzeMedia({} as any, makeJob({ media_id: "m1" }))).rejects.toBeInstanceOf(
      JobPayloadError
    );
  });

  it("passes payload.project_id only as projectIdClaim (never as trusted auth)", async () => {
    const { resolveImageUrlDetailed } = await import("./resolve-image-url");
    vi.mocked(resolveImageUrlDetailed).mockResolvedValue({
      ok: false,
      code: AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED,
      retryable: false,
      message: "Project claim does not match trusted project",
    });

    await expect(
      handleAiAnalyzeMedia(
        {} as any,
        makeJob({
          report_id: "r1",
          media_id: "m1",
          project_id: foreignProject,
        })
      )
    ).rejects.toMatchObject({
      name: "JobPayloadError",
      code: AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED,
    });

    expect(resolveImageUrlDetailed).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ report_id: "r1", media_id: "m1" }),
      expect.objectContaining({
        tenantId: tenantA,
        projectIdClaim: foreignProject,
      })
    );
    // Must not pass raw project as trusted projectId option
    const opts = vi.mocked(resolveImageUrlDetailed).mock.calls[0]![2] as Record<string, unknown>;
    expect(opts).not.toHaveProperty("projectId");
  });

  it("does not call analyzeImage when resolve denies foreign project claim", async () => {
    const { resolveImageUrlDetailed } = await import("./resolve-image-url");
    const ai = await import("@/lib/platform/ai/ai.service");
    vi.mocked(resolveImageUrlDetailed).mockResolvedValue({
      ok: false,
      code: AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED,
      retryable: false,
      message: "Project not in tenant scope",
    });

    await expect(
      handleAiAnalyzeMedia(
        {} as any,
        makeJob({
          report_id: "r1",
          image_url: `${foreignProject}/secret.jpg`,
          project_id: foreignProject,
        })
      )
    ).rejects.toBeInstanceOf(JobPayloadError);

    expect(ai.analyzeImage).not.toHaveBeenCalled();
  });

  it("passes only trustedProjectId into analyzeImage (never raw payload.project_id)", async () => {
    const { resolveImageUrlDetailed } = await import("./resolve-image-url");
    const ai = await import("@/lib/platform/ai/ai.service");
    const trusted = "55555555-5555-4555-8555-555555555555";
    vi.mocked(resolveImageUrlDetailed).mockResolvedValue({
      ok: true,
      imageUrl: "https://signed.example/x",
      source: "media",
      objectPath: `${tenantA}/x.jpg`,
      trustedProjectId: trusted,
    });
    vi.mocked(ai.analyzeImage).mockResolvedValue({
      stage: "foundation",
      completion_percent: 10,
      risk_level: "low",
      detected_issues: [],
      recommendations: [],
    } as any);

    await handleAiAnalyzeMedia(
      {} as any,
      makeJob({
        report_id: "r1",
        media_id: "m1",
        project_id: foreignProject, // attacker claim — must not reach analyzeImage
      })
    );

    expect(ai.analyzeImage).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        projectId: trusted,
      })
    );
    const visionArgs = vi.mocked(ai.analyzeImage).mock.calls[0]![2] as { projectId?: string };
    expect(visionArgs.projectId).not.toBe(foreignProject);
  });

  it("throws retryable JobHandlerError when media not ready", async () => {
    const { resolveImageUrlDetailed } = await import("./resolve-image-url");
    vi.mocked(resolveImageUrlDetailed).mockResolvedValue({
      ok: false,
      code: AI_ERROR_CODES.AI_MEDIA_NOT_READY,
      retryable: true,
      message: "Upload session not finalized yet",
    });

    await expect(
      handleAiAnalyzeMedia({} as any, makeJob({ report_id: "r1", upload_session_id: "u1" }))
    ).rejects.toMatchObject({
      name: "JobHandlerError",
      retryable: true,
      code: AI_ERROR_CODES.AI_MEDIA_NOT_READY,
    });
  });

  it("throws permanent JobPayloadError when media cannot be resolved", async () => {
    const { resolveImageUrlDetailed } = await import("./resolve-image-url");
    vi.mocked(resolveImageUrlDetailed).mockResolvedValue({
      ok: false,
      code: AI_ERROR_CODES.AI_MEDIA_NOT_FOUND,
      retryable: false,
      message: "Could not resolve image from media_id or upload_session_id",
    });

    await expect(
      handleAiAnalyzeMedia({} as any, makeJob({ report_id: "r1", upload_session_id: "u1" }))
    ).rejects.toMatchObject({
      name: "JobPayloadError",
      code: AI_ERROR_CODES.AI_MEDIA_NOT_FOUND,
      retryable: false,
    });
  });

  it("marks provider not configured as non-retryable", async () => {
    const { resolveImageUrlDetailed } = await import("./resolve-image-url");
    const ai = await import("@/lib/platform/ai/ai.service");
    vi.mocked(resolveImageUrlDetailed).mockResolvedValue({
      ok: true,
      imageUrl: "https://signed.example/x",
      source: "upload_session",
      objectPath: "t/s/x.jpg",
      trustedProjectId: null,
    });
    vi.mocked(ai.analyzeImage).mockRejectedValueOnce(
      new ai.AIVisionFailedError(
        "AI provider not configured for this environment",
        AI_ERROR_CODES.AI_PROVIDER_NOT_CONFIGURED,
        false
      )
    );

    await expect(
      handleAiAnalyzeMedia({} as any, makeJob({ report_id: "r1", upload_session_id: "u1" }))
    ).rejects.toMatchObject({
      name: "JobHandlerError",
      retryable: false,
      code: AI_ERROR_CODES.AI_PROVIDER_NOT_CONFIGURED,
    });
  });

  it("marks providers exhausted as retryable", async () => {
    const { resolveImageUrlDetailed } = await import("./resolve-image-url");
    const ai = await import("@/lib/platform/ai/ai.service");
    vi.mocked(resolveImageUrlDetailed).mockResolvedValue({
      ok: true,
      imageUrl: "https://signed.example/x",
      source: "upload_session",
      objectPath: "t/s/x.jpg",
      trustedProjectId: null,
    });
    vi.mocked(ai.analyzeImage).mockRejectedValueOnce(
      new ai.AIVisionFailedError(
        "All AI providers failed or are unavailable",
        AI_ERROR_CODES.AI_PROVIDERS_EXHAUSTED,
        true
      )
    );

    await expect(
      handleAiAnalyzeMedia({} as any, makeJob({ report_id: "r1", upload_session_id: "u1" }))
    ).rejects.toMatchObject({
      name: "JobHandlerError",
      retryable: true,
      code: AI_ERROR_CODES.AI_PROVIDERS_EXHAUSTED,
    });
  });

  it("succeeds when resolve + analyzeImage ok (idempotent handler)", async () => {
    const { resolveImageUrlDetailed } = await import("./resolve-image-url");
    const ai = await import("@/lib/platform/ai/ai.service");
    vi.mocked(resolveImageUrlDetailed).mockResolvedValue({
      ok: true,
      imageUrl: "https://signed.example/x",
      source: "media",
      objectPath: "t/x.jpg",
      trustedProjectId: null,
    });
    vi.mocked(ai.analyzeImage).mockResolvedValue({
      stage: "foundation",
      completion_percent: 10,
      risk_level: "low",
      detected_issues: [],
      recommendations: [],
    } as any);

    await expect(
      handleAiAnalyzeMedia({} as any, makeJob({ report_id: "r1", media_id: "m1" }))
    ).resolves.toBeUndefined();
    await expect(
      handleAiAnalyzeMedia({} as any, makeJob({ report_id: "r1", media_id: "m1" }))
    ).resolves.toBeUndefined();
    expect(ai.analyzeImage).toHaveBeenCalledTimes(2);
  });
});
