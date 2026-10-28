import { describe, expect, it, vi } from "vitest";
import { reviewAiAnalysis, validateReviewVerdict } from "./review.service";

function mockReviewClient(opts: {
  load: unknown;
  update: unknown;
  correctionInsert?: unknown;
}) {
  const loadMaybe = vi.fn().mockResolvedValue({ data: opts.load, error: null });
  const updateMaybe = vi.fn().mockResolvedValue({ data: opts.update, error: null });
  const correctionMaybe = vi
    .fn()
    .mockResolvedValue({ data: opts.correctionInsert ?? { id: "corr-1" }, error: null });
  const eq2 = vi.fn().mockReturnValue({
    select: () => ({ maybeSingle: updateMaybe }),
  });
  const eq1 = vi.fn().mockReturnValue({ eq: eq2 });

  return {
    from: vi.fn((table: string) => {
      if (table === "ai_analysis_corrections") {
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({ maybeSingle: correctionMaybe })),
          })),
        };
      }
      return {
        select: () => ({
          eq: () => ({ maybeSingle: loadMaybe }),
        }),
        update: () => ({ eq: eq1 }),
      };
    }),
  };
}

describe("validateReviewVerdict", () => {
  it("accepts terminal verdicts only", () => {
    expect(validateReviewVerdict("accepted")).toBe("accepted");
    expect(validateReviewVerdict("edited")).toBe("edited");
    expect(validateReviewVerdict("rejected")).toBe("rejected");
    expect(validateReviewVerdict("insufficient_evidence")).toBe("insufficient_evidence");
    expect(validateReviewVerdict("pending")).toBeNull();
    expect(validateReviewVerdict("")).toBeNull();
  });
});

describe("reviewAiAnalysis", () => {
  it("returns NOT_FOUND when row missing or tenant mismatches", async () => {
    const supabase = mockReviewClient({ load: null, update: null });
    const missing = await reviewAiAnalysis(supabase as never, {
      analysisId: "a1",
      tenantId: "t1",
      reviewerUserId: "u1",
      status: "accepted",
    });
    expect(missing).toEqual({ ok: false, error: "Analysis not found", code: "NOT_FOUND" });

    const mismatchClient = mockReviewClient({
      load: { id: "a1", tenant_id: "other", review_status: "pending" },
      update: null,
    });
    const mismatch = await reviewAiAnalysis(mismatchClient as never, {
      analysisId: "a1",
      tenantId: "t1",
      reviewerUserId: "u1",
      status: "accepted",
    });
    expect(mismatch.code).toBe("NOT_FOUND");
  });

  it("updates review fields, records correction, graphEligible for accepted", async () => {
    const supabase = mockReviewClient({
      load: {
        id: "a1",
        tenant_id: "t1",
        review_status: "pending",
        stage: "rough",
        completion_percent: 40,
        risk_level: "medium",
        detected_issues: ["gap"],
        recommendations: ["fix"],
        frame_count: 1,
      },
      update: {
        id: "a1",
        review_status: "accepted",
        reviewed_at: "2026-10-28T12:00:00.000Z",
        reviewed_by: "u1",
      },
    });

    const out = await reviewAiAnalysis(supabase as never, {
      analysisId: "a1",
      tenantId: "t1",
      reviewerUserId: "u1",
      status: "accepted",
      note: "ok",
    });
    expect(out).toMatchObject({
      ok: true,
      analysisId: "a1",
      reviewStatus: "accepted",
      graphEligible: true,
      reviewedBy: "u1",
      correctionId: "corr-1",
    });
  });

  it("requires correctedPayload for edited and marks graph-eligible", async () => {
    const missingPayload = await reviewAiAnalysis(mockReviewClient({ load: null, update: null }) as never, {
      analysisId: "a1",
      tenantId: "t1",
      reviewerUserId: "u1",
      status: "edited",
    });
    expect(missingPayload).toMatchObject({ ok: false, code: "INVALID_INPUT" });

    const supabase = mockReviewClient({
      load: {
        id: "a1",
        tenant_id: "t1",
        review_status: "pending",
        stage: "rough",
        completion_percent: 40,
        risk_level: "medium",
        detected_issues: [],
        recommendations: [],
        frame_count: 1,
      },
      update: {
        id: "a1",
        review_status: "edited",
        reviewed_at: "2026-10-28T12:00:00.000Z",
        reviewed_by: "u1",
      },
    });
    const out = await reviewAiAnalysis(supabase as never, {
      analysisId: "a1",
      tenantId: "t1",
      reviewerUserId: "u1",
      status: "edited",
      note: "fixed stage",
      correctedPayload: { stage: "finish", completion_percent: 90 },
    });
    expect(out).toMatchObject({
      ok: true,
      reviewStatus: "edited",
      graphEligible: true,
      correctionId: "corr-1",
    });
  });

  it("marks insufficient_evidence as not Graph-eligible", async () => {
    const supabase = mockReviewClient({
      load: {
        id: "a1",
        tenant_id: "t1",
        review_status: "pending",
        stage: null,
        completion_percent: null,
        risk_level: null,
        detected_issues: null,
        recommendations: null,
        frame_count: null,
      },
      update: {
        id: "a1",
        review_status: "insufficient_evidence",
        reviewed_at: "2026-10-28T12:00:00.000Z",
        reviewed_by: "u1",
      },
    });
    const out = await reviewAiAnalysis(supabase as never, {
      analysisId: "a1",
      tenantId: "t1",
      reviewerUserId: "u1",
      status: "insufficient_evidence",
      note: "blurry",
    });
    expect(out).toMatchObject({
      ok: true,
      reviewStatus: "insufficient_evidence",
      graphEligible: false,
      correctionId: "corr-1",
    });
  });
});
