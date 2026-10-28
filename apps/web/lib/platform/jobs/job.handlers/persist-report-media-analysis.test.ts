import { describe, expect, it, vi } from "vitest";
import {
  findExistingReportMediaAnalysis,
  persistReportMediaAnalysis,
} from "./persist-report-media-analysis";
import { JobHandlerError } from "../job.errors";

const result = {
  stage: "foundation",
  completion_percent: 12,
  risk_level: "low" as const,
  detected_issues: ["crack"],
  recommendations: ["inspect"],
};

describe("persistReportMediaAnalysis", () => {
  it("returns existing row without inserting when platform_job_id already bound", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: { id: "a1" }, error: null });
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: () => ({
          eq: () => ({ maybeSingle }),
        }),
      }),
    };
    const out = await persistReportMediaAnalysis(supabase as never, {
      tenantId: "t1",
      platformJobId: "job-1",
      reportId: "r1",
      mediaId: "m1",
      trustedProjectId: "p1",
      result,
    });
    expect(out).toEqual({ analysisId: "a1", created: false });
    expect(supabase.from).toHaveBeenCalledWith("ai_analysis");
  });

  it("inserts ai_analysis bound to media_id and platform_job_id", async () => {
    const lookup = vi.fn().mockResolvedValue({ data: null, error: null });
    const insertMaybe = vi.fn().mockResolvedValue({ data: { id: "a2" }, error: null });
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: () => ({
          eq: () => ({ maybeSingle: lookup }),
        }),
        insert: (row: Record<string, unknown>) => {
          expect(row).toMatchObject({
            media_id: "m1",
            tenant_id: "t1",
            platform_job_id: "job-1",
            stage: "foundation",
            risk_level: "low",
            review_status: "pending",
          });
          return {
            select: () => ({ maybeSingle: insertMaybe }),
          };
        },
      }),
    };
    const out = await persistReportMediaAnalysis(supabase as never, {
      tenantId: "t1",
      platformJobId: "job-1",
      reportId: "r1",
      mediaId: "m1",
      trustedProjectId: "p1",
      result,
    });
    expect(out).toEqual({ analysisId: "a2", created: true });
  });

  it("fails closed when media_id is missing (upload-session-only needs promotion)", async () => {
    const lookup = vi.fn().mockResolvedValue({ data: null, error: null });
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: () => ({
          eq: () => ({ maybeSingle: lookup }),
        }),
      }),
    };
    await expect(
      persistReportMediaAnalysis(supabase as never, {
        tenantId: "t1",
        platformJobId: "job-1",
        reportId: "r1",
        mediaId: null,
        trustedProjectId: "p1",
        result,
      })
    ).rejects.toMatchObject({
      name: "JobHandlerError",
      code: "AI_RESULT_MEDIA_ID_REQUIRED",
      retryable: false,
    });
  });

  it("findExistingReportMediaAnalysis surfaces lookup failures as retryable", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: { message: "db down" } });
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: () => ({
          eq: () => ({ maybeSingle }),
        }),
      }),
    };
    await expect(findExistingReportMediaAnalysis(supabase as never, "job-1")).rejects.toBeInstanceOf(
      JobHandlerError
    );
  });
});
