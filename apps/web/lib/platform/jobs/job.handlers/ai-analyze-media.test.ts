import { describe, expect, it, vi, beforeEach } from "vitest";
import { handleAiAnalyzeMedia } from "./ai-analyze-media";
import { JobHandlerError, JobPayloadError } from "../job.errors";
import type { Job } from "../job.types";

vi.mock("./resolve-image-url", () => ({
  resolveImageUrl: vi.fn(),
}));

vi.mock("@/lib/platform/subscription/subscription.service", () => ({
  getTierForTenant: vi.fn().mockResolvedValue("free"),
}));

vi.mock("@/lib/platform/ai/ai.service", () => ({
  analyzeImage: vi.fn().mockResolvedValue(undefined),
  AIPolicyBlockedError: class AIPolicyBlockedError extends Error {},
  AIVisionFailedError: class AIVisionFailedError extends Error {},
}));

function makeJob(payload: Record<string, unknown>): Job {
  return {
    id: "job-1",
    tenant_id: "tenant-1",
    user_id: "user-1",
    type: "ai_analyze_media",
    status: "queued",
    payload,
    attempts: 0,
    max_attempts: 5,
    run_after: null,
    dedupe_key: null,
    trace_id: null,
    last_error: null,
    last_error_type: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function makeSupabase(status: string | null, mediaFileUrl: string | null) {
  return {
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue(
        table === "upload_sessions"
          ? { data: status ? { status } : null, error: null }
          : { data: mediaFileUrl === null ? { id: "m1", file_url: null } : null, error: null }
      ),
    })),
  } as any;
}

describe("handleAiAnalyzeMedia", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws JobPayloadError when report_id missing", async () => {
    const supabase = makeSupabase(null, null);
    await expect(handleAiAnalyzeMedia(supabase, makeJob({ media_id: "m1" }))).rejects.toBeInstanceOf(
      JobPayloadError
    );
  });

  it("throws retryable JobHandlerError when upload session is pending", async () => {
    const { resolveImageUrl } = await import("./resolve-image-url");
    vi.mocked(resolveImageUrl).mockResolvedValue(null);
    const supabase = makeSupabase("uploaded", null);

    await expect(
      handleAiAnalyzeMedia(supabase, makeJob({ report_id: "r1", upload_session_id: "u1" }))
    ).rejects.toMatchObject({
      name: "JobHandlerError",
      retryable: true,
    });
  });

  it("throws JobPayloadError when URL cannot be resolved and no pending state", async () => {
    const { resolveImageUrl } = await import("./resolve-image-url");
    vi.mocked(resolveImageUrl).mockResolvedValue(null);
    const supabase = makeSupabase("finalized", null);

    await expect(
      handleAiAnalyzeMedia(supabase, makeJob({ report_id: "r1", upload_session_id: "u1" }))
    ).rejects.toBeInstanceOf(JobPayloadError);
  });
});
