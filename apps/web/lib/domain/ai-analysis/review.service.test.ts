import { beforeEach, describe, expect, it, vi } from "vitest";

const invalidateConstructionGraphForSource = vi.hoisted(() => vi.fn());

vi.mock("@/lib/domain/construction-graph/construction-graph.repository", () => ({
  invalidateConstructionGraphForSource,
}));

import {
  reviewAiAnalysis,
  validateReviewVerdict,
  type CorrectedAnalysisPayload,
  type ReviewAiAnalysisInput,
} from "./review.service";

const ANALYSIS = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const TENANT = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const REVIEWER = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const MEDIA = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const PROJECT = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const CORRECTION = "ffffffff-ffff-4fff-8fff-ffffffffffff";
const REVIEWED_AT = "2026-11-27T12:00:00.000Z";

function input(overrides: Partial<ReviewAiAnalysisInput> = {}): ReviewAiAnalysisInput {
  return {
    analysisId: ANALYSIS,
    tenantId: TENANT,
    reviewerUserId: REVIEWER,
    status: "accepted",
    ...overrides,
  };
}

function receipt(overrides: Record<string, unknown> = {}) {
  return {
    id: ANALYSIS,
    review_status: "accepted",
    reviewed_at: REVIEWED_AT,
    reviewed_by: REVIEWER,
    correction_id: CORRECTION,
    media_id: MEDIA,
    ...overrides,
  };
}

function mockReviewClient(opts: {
  receipt?: unknown;
  error?: { code?: string; message?: string } | null;
  projectId?: string | null;
} = {}) {
  const rpc = vi.fn().mockResolvedValue({
    data: opts.receipt === undefined ? receipt() : opts.receipt,
    error: opts.error ?? null,
  });
  const mediaMaybe = vi.fn().mockResolvedValue({
    data: opts.projectId ? { project_id: opts.projectId } : null,
    error: null,
  });
  const mediaQuery = { eq: vi.fn(), maybeSingle: mediaMaybe };
  mediaQuery.eq.mockReturnValue(mediaQuery);
  const mediaSelect = vi.fn().mockReturnValue(mediaQuery);
  const from = vi.fn((table: string) => {
    if (table !== "media") {
      throw new Error("Review writes must use the atomic RPC, never direct table operations");
    }
    return { select: mediaSelect };
  });
  return { client: { rpc, from }, rpc, from, mediaSelect, mediaEq: mediaQuery.eq, mediaMaybe };
}

describe("validateReviewVerdict", () => {
  it("accepts terminal verdicts only", () => {
    for (const verdict of ["accepted", "edited", "rejected", "insufficient_evidence"] as const) {
      expect(validateReviewVerdict(verdict)).toBe(verdict);
    }
    for (const invalid of ["pending", "", "unknown", null, undefined, 42, {}]) {
      expect(validateReviewVerdict(invalid)).toBeNull();
    }
  });
});

describe("reviewAiAnalysis atomic contract", () => {
  beforeEach(() => {
    invalidateConstructionGraphForSource.mockReset().mockResolvedValue({
      invalidated: true,
      removedNodes: 1,
    });
  });

  it("records one atomic verdict and requires its correction receipt without direct writes", async () => {
    const db = mockReviewClient();
    const result = await reviewAiAnalysis(db.client as never, input({ note: "  checked  " }));

    expect(db.rpc).toHaveBeenCalledExactlyOnceWith("review_ai_analysis_atomic", {
      p_analysis_id: ANALYSIS,
      p_tenant_id: TENANT,
      p_reviewer_user_id: REVIEWER,
      p_status: "accepted",
      p_note: "checked",
      p_corrected_payload: null,
    });
    expect(result).toEqual({
      ok: true,
      analysisId: ANALYSIS,
      reviewStatus: "accepted",
      graphEligible: true,
      reviewedAt: REVIEWED_AT,
      reviewedBy: REVIEWER,
      correctionId: CORRECTION,
    });
    expect(db.from).not.toHaveBeenCalled();
    expect(invalidateConstructionGraphForSource).not.toHaveBeenCalled();
  });

  it("normalizes identifier whitespace and UUID casing before calling or comparing the receipt", async () => {
    const db = mockReviewClient();
    const result = await reviewAiAnalysis(db.client as never, input({
      analysisId: " " + ANALYSIS.toUpperCase() + " ",
      tenantId: "\n" + TENANT.toUpperCase() + "\n",
      reviewerUserId: REVIEWER.toUpperCase(),
    }));
    expect(result).toMatchObject({ ok: true, analysisId: ANALYSIS, reviewedBy: REVIEWER });
    expect(db.rpc).toHaveBeenCalledWith("review_ai_analysis_atomic", expect.objectContaining({
      p_analysis_id: ANALYSIS,
      p_tenant_id: TENANT,
      p_reviewer_user_id: REVIEWER,
    }));
  });

  it.each(["analysisId", "tenantId", "reviewerUserId"] as const)(
    "rejects empty %s before any RPC or graph operation",
    async (field) => {
      const db = mockReviewClient();
      const result = await reviewAiAnalysis(db.client as never, input({ [field]: " \n " }));
      expect(result).toMatchObject({ ok: false, code: "INVALID_INPUT" });
      expect(db.rpc).not.toHaveBeenCalled();
      expect(db.from).not.toHaveBeenCalled();
      expect(invalidateConstructionGraphForSource).not.toHaveBeenCalled();
    }
  );

  it.each(["pending", "invalid", ""])("rejects unsupported verdict %s before the RPC", async (status) => {
    const db = mockReviewClient();
    const result = await reviewAiAnalysis(db.client as never, input({
      status: status as ReviewAiAnalysisInput["status"],
    }));
    expect(result).toMatchObject({ ok: false, code: "INVALID_INPUT" });
    expect(db.rpc).not.toHaveBeenCalled();
    expect(invalidateConstructionGraphForSource).not.toHaveBeenCalled();
  });

  it.each([undefined, null, [], "patch", 1])(
    "rejects a non-object edited payload (%j) before the RPC",
    async (correctedPayload) => {
      const db = mockReviewClient();
      const result = await reviewAiAnalysis(db.client as never, input({
        status: "edited",
        correctedPayload: correctedPayload as CorrectedAnalysisPayload | null | undefined,
      }));
      expect(result).toMatchObject({ ok: false, code: "INVALID_INPUT" });
      expect(db.rpc).not.toHaveBeenCalled();
      expect(db.from).not.toHaveBeenCalled();
      expect(invalidateConstructionGraphForSource).not.toHaveBeenCalled();
    }
  );

  it("sends only supported, bounded corrected fields and preserves the atomic edited receipt", async () => {
    const db = mockReviewClient({ receipt: receipt({ review_status: "edited" }) });
    const issues = Array.from({ length: 70 }, (_, i) => "issue-" + i);
    const recommendations = Array.from({ length: 70 }, (_, i) => "recommendation-" + i);
    const correctedPayload = {
      stage: "s".repeat(250),
      completion_percent: 150.9,
      risk_level: "r".repeat(50),
      detected_issues: [null, 7, ...issues],
      recommendations: [false, {}, ...recommendations],
      tenant_id: "another-tenant",
      margin: 42,
      original_prediction: { private: "must not be supplied by the caller" },
    } as unknown as CorrectedAnalysisPayload;
    const result = await reviewAiAnalysis(db.client as never, input({
      status: "edited",
      note: "  " + "n".repeat(2050) + "  ",
      correctedPayload,
    }));
    expect(result).toMatchObject({ ok: true, reviewStatus: "edited", graphEligible: true, correctionId: CORRECTION });
    expect(db.rpc).toHaveBeenCalledExactlyOnceWith("review_ai_analysis_atomic", {
      p_analysis_id: ANALYSIS,
      p_tenant_id: TENANT,
      p_reviewer_user_id: REVIEWER,
      p_status: "edited",
      p_note: "n".repeat(2000),
      p_corrected_payload: {
        stage: "s".repeat(200),
        completion_percent: 100,
        risk_level: "r".repeat(40),
        detected_issues: issues.slice(0, 64),
        recommendations: recommendations.slice(0, 64),
      },
    });
    expect(db.from).not.toHaveBeenCalled();
    expect(invalidateConstructionGraphForSource).not.toHaveBeenCalled();
  });

  it.each([
    [12.9, 12],
    [-5.8, 0],
    [Number.NaN, undefined],
    [Number.POSITIVE_INFINITY, undefined],
  ])("normalizes corrected completion %s without forwarding non-finite values", async (value, expected) => {
    const db = mockReviewClient({ receipt: receipt({ review_status: "edited" }) });
    await reviewAiAnalysis(db.client as never, input({
      status: "edited",
      correctedPayload: { completion_percent: value },
    }));
    const patch = db.rpc.mock.calls[0][1].p_corrected_payload;
    expect(patch).toEqual(expected === undefined ? {} : { completion_percent: expected });
  });

  it("ignores prediction edits on accepted verdicts and normalizes an empty note to null", async () => {
    const db = mockReviewClient();
    await reviewAiAnalysis(db.client as never, input({
      note: " \n ",
      correctedPayload: { stage: "should not change" },
    }));
    expect(db.rpc).toHaveBeenCalledWith("review_ai_analysis_atomic", expect.objectContaining({
      p_note: null,
      p_corrected_payload: null,
    }));
  });

  it.each([
    ["P0002", "NOT_FOUND", "Analysis not found"],
    ["42501", "FORBIDDEN", "Reviewer is not authorized"],
    ["22023", "INVALID_INPUT", "Invalid review payload"],
    ["23514", "INVALID_INPUT", "Invalid review payload"],
    ["22P02", "INVALID_INPUT", "Invalid review payload"],
    ["XX000", "UPDATE_FAILED", "Review could not be recorded"],
  ])("maps database %s to %s without leaking details or invalidating Graph", async (sqlCode, code, error) => {
    const db = mockReviewClient({
      receipt: receipt({ review_status: "rejected" }),
      error: { code: sqlCode, message: "private prediction and tenant detail" },
      projectId: PROJECT,
    });
    const result = await reviewAiAnalysis(db.client as never, input({ status: "rejected" }));
    expect(result).toEqual({ ok: false, code, error });
    expect(db.rpc).toHaveBeenCalledTimes(1);
    expect(db.from).not.toHaveBeenCalled();
    expect(invalidateConstructionGraphForSource).not.toHaveBeenCalled();
  });

  const rejectedReceipt = receipt({ review_status: "rejected" });
  it.each([
    ["missing object", null],
    ["array instead of object", [rejectedReceipt]],
    ["wrong analysis", { ...rejectedReceipt, id: "other" }],
    ["pending status", { ...rejectedReceipt, review_status: "pending" }],
    ["different terminal verdict", { ...rejectedReceipt, review_status: "accepted" }],
    ["missing timestamp", { ...rejectedReceipt, reviewed_at: null }],
    ["empty timestamp", { ...rejectedReceipt, reviewed_at: "" }],
    ["different reviewer", { ...rejectedReceipt, reviewed_by: "other" }],
    ["missing correction", { ...rejectedReceipt, correction_id: null }],
    ["empty correction", { ...rejectedReceipt, correction_id: "" }],
  ])("rejects malformed receipt: %s before graph invalidation", async (_name, data) => {
    const db = mockReviewClient({ receipt: data, projectId: PROJECT });
    const result = await reviewAiAnalysis(db.client as never, input({ status: "rejected" }));
    expect(result).toEqual({ ok: false, error: "Incomplete review receipt", code: "UPDATE_FAILED" });
    expect(db.from).not.toHaveBeenCalled();
    expect(invalidateConstructionGraphForSource).not.toHaveBeenCalled();
  });

  it.each(["rejected", "insufficient_evidence"] as const)(
    "invalidates %s only after the durable receipt, scoped to its tenant and media project",
    async (status) => {
      const db = mockReviewClient({ receipt: receipt({ review_status: status }), projectId: PROJECT });
      const result = await reviewAiAnalysis(db.client as never, input({ status }));
      expect(result).toMatchObject({ ok: true, reviewStatus: status, graphEligible: false, correctionId: CORRECTION });
      expect(db.rpc).toHaveBeenCalledTimes(1);
      expect(db.from).toHaveBeenCalledExactlyOnceWith("media");
      expect(db.mediaSelect).toHaveBeenCalledWith("project_id");
      expect(db.mediaEq.mock.calls).toEqual([["id", MEDIA], ["tenant_id", TENANT]]);
      expect(invalidateConstructionGraphForSource).toHaveBeenCalledExactlyOnceWith(db.client, {
        tenantId: TENANT,
        projectId: PROJECT,
        sourceTable: "ai_analysis",
        sourceId: ANALYSIS,
      });
      expect(db.rpc.mock.invocationCallOrder[0]).toBeLessThan(
        invalidateConstructionGraphForSource.mock.invocationCallOrder[0]
      );
    }
  );

  it("revokes by tenant/source even without a media association", async () => {
    const db = mockReviewClient({ receipt: receipt({ review_status: "rejected", media_id: null }) });
    const result = await reviewAiAnalysis(db.client as never, input({ status: "rejected" }));
    expect(result).toMatchObject({ ok: true, graphEligible: false });
    expect(db.from).not.toHaveBeenCalled();
    expect(invalidateConstructionGraphForSource).toHaveBeenCalledWith(db.client, {
      tenantId: TENANT,
      projectId: null,
      sourceTable: "ai_analysis",
      sourceId: ANALYSIS,
    });
  });

  it("keeps a durable verdict when Graph invalidation fails", async () => {
    const db = mockReviewClient({ receipt: receipt({ review_status: "rejected" }), projectId: PROJECT });
    invalidateConstructionGraphForSource.mockRejectedValueOnce(new Error("overlay unavailable"));
    const result = await reviewAiAnalysis(db.client as never, input({ status: "rejected" }));
    expect(result).toMatchObject({ ok: true, graphEligible: false, correctionId: CORRECTION });
    expect(db.rpc).toHaveBeenCalledTimes(1);
    expect(invalidateConstructionGraphForSource).toHaveBeenCalledTimes(1);
  });

  it("keeps a durable verdict if the optional media lookup throws", async () => {
    const db = mockReviewClient({ receipt: receipt({ review_status: "insufficient_evidence" }) });
    db.mediaMaybe.mockRejectedValueOnce(new Error("media lookup unavailable"));
    const result = await reviewAiAnalysis(db.client as never, input({ status: "insufficient_evidence" }));
    expect(result).toMatchObject({ ok: true, graphEligible: false, correctionId: CORRECTION });
    expect(db.rpc).toHaveBeenCalledTimes(1);
  });
});
