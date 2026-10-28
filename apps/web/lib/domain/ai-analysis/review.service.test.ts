import { describe, expect, it, vi } from "vitest";
import { reviewAiAnalysis, validateReviewVerdict } from "./review.service";

describe("validateReviewVerdict", () => {
  it("accepts terminal verdicts only", () => {
    expect(validateReviewVerdict("accepted")).toBe("accepted");
    expect(validateReviewVerdict("rejected")).toBe("rejected");
    expect(validateReviewVerdict("insufficient_evidence")).toBe("insufficient_evidence");
    expect(validateReviewVerdict("pending")).toBeNull();
    expect(validateReviewVerdict("")).toBeNull();
  });
});

describe("reviewAiAnalysis", () => {
  it("returns NOT_FOUND when row missing or tenant mismatches", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: () => ({
          eq: () => ({ maybeSingle }),
        }),
      }),
    };
    const missing = await reviewAiAnalysis(supabase as never, {
      analysisId: "a1",
      tenantId: "t1",
      reviewerUserId: "u1",
      status: "accepted",
    });
    expect(missing).toEqual({ ok: false, error: "Analysis not found", code: "NOT_FOUND" });

    maybeSingle.mockResolvedValueOnce({
      data: { id: "a1", tenant_id: "other", review_status: "pending" },
      error: null,
    });
    const mismatch = await reviewAiAnalysis(supabase as never, {
      analysisId: "a1",
      tenantId: "t1",
      reviewerUserId: "u1",
      status: "accepted",
    });
    expect(mismatch.code).toBe("NOT_FOUND");
  });

  it("updates review fields and reports graphEligible only for accepted", async () => {
    const load = vi.fn().mockResolvedValue({
      data: { id: "a1", tenant_id: "t1", review_status: "pending" },
      error: null,
    });
    const updateMaybe = vi.fn().mockResolvedValue({
      data: {
        id: "a1",
        review_status: "accepted",
        reviewed_at: "2026-10-28T12:00:00.000Z",
        reviewed_by: "u1",
      },
      error: null,
    });
    const eq2 = vi.fn().mockReturnValue({
      select: () => ({ maybeSingle: updateMaybe }),
    });
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
    const supabase = {
      from: vi.fn().mockImplementation(() => ({
        select: () => ({
          eq: () => ({ maybeSingle: load }),
        }),
        update: (row: Record<string, unknown>) => {
          expect(row).toMatchObject({
            review_status: "accepted",
            reviewed_by: "u1",
            review_note: "ok",
          });
          expect(typeof row.reviewed_at).toBe("string");
          return { eq: eq1 };
        },
      })),
    };

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
    });
  });

  it("marks insufficient_evidence as not Graph-eligible", async () => {
    const load = vi.fn().mockResolvedValue({
      data: { id: "a1", tenant_id: "t1", review_status: "pending" },
      error: null,
    });
    const updateMaybe = vi.fn().mockResolvedValue({
      data: {
        id: "a1",
        review_status: "insufficient_evidence",
        reviewed_at: "2026-10-28T12:00:00.000Z",
        reviewed_by: "u1",
      },
      error: null,
    });
    const eq2 = vi.fn().mockReturnValue({
      select: () => ({ maybeSingle: updateMaybe }),
    });
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: () => ({
          eq: () => ({ maybeSingle: load }),
        }),
        update: () => ({ eq: eq1 }),
      }),
    };
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
    });
  });
});
