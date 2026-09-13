/**
 * AI Brain Phase D — Feedback service tests.
 */

import { describe, it, expect, vi } from "vitest";
import {
  validateFeedbackCategory,
  validateSourceKind,
  validateScore,
  validateLinkedRefs,
  submitFeedback,
} from "./feedback.service";

vi.mock("../run/run.repository", () => ({
  getRunRecordIdByRunId: vi.fn().mockResolvedValue("run-record-1"),
}));

vi.mock("./feedback.repository", () => ({
  createFeedbackRecord: vi.fn().mockResolvedValue({ id: "fb-1" }),
}));

vi.mock("@/lib/platform/ai-flywheel/feedback-wire", () => ({
  parseFeedbackPreferencePair: vi.fn(),
  tryCaptureFeedbackPreferencePair: vi.fn().mockResolvedValue(undefined),
}));

import { getRunRecordIdByRunId } from "../run/run.repository";
import { createFeedbackRecord } from "./feedback.repository";
import { tryCaptureFeedbackPreferencePair } from "@/lib/platform/ai-flywheel/feedback-wire";

describe("feedback validation", () => {
  describe("validateFeedbackCategory", () => {
    it("accepts valid categories", () => {
      expect(validateFeedbackCategory("factuality")).toBe(true);
      expect(validateFeedbackCategory("usefulness")).toBe(true);
      expect(validateFeedbackCategory("safety")).toBe(true);
      expect(validateFeedbackCategory("action_relevance")).toBe(true);
    });

    it("rejects invalid categories", () => {
      expect(validateFeedbackCategory("invalid")).toBe(false);
      expect(validateFeedbackCategory("")).toBe(false);
      expect(validateFeedbackCategory(123)).toBe(false);
    });
  });

  describe("validateSourceKind", () => {
    it("accepts human, system, test", () => {
      expect(validateSourceKind("human")).toBe(true);
      expect(validateSourceKind("system")).toBe(true);
      expect(validateSourceKind("test")).toBe(true);
    });

    it("rejects invalid", () => {
      expect(validateSourceKind("other")).toBe(false);
    });
  });

  describe("validateScore", () => {
    it("accepts 0-5", () => {
      expect(validateScore(0)).toBe(0);
      expect(validateScore(3)).toBe(3);
      expect(validateScore(5)).toBe(5);
    });

    it("rejects out of range", () => {
      expect(validateScore(-1)).toBeNull();
      expect(validateScore(6)).toBeNull();
      expect(validateScore(10)).toBeNull();
    });

    it("rejects null/undefined", () => {
      expect(validateScore(null)).toBeNull();
      expect(validateScore(undefined)).toBeNull();
    });
  });

  describe("validateLinkedRefs", () => {
    it("accepts valid refs", () => {
      const refs = validateLinkedRefs([
        { type: "action", ref: "a1" },
        { type: "output", ref: "o1" },
      ]);
      expect(refs).toHaveLength(2);
    });

    it("filters invalid entries", () => {
      const refs = validateLinkedRefs([
        { type: "action", ref: "a1" },
        { type: "invalid", ref: "x" },
        { type: "run", ref: "" },
      ]);
      expect(refs).toHaveLength(2);
    });

    it("returns empty for non-array", () => {
      expect(validateLinkedRefs(null)).toHaveLength(0);
      expect(validateLinkedRefs({})).toHaveLength(0);
    });
  });
});

describe("submitFeedback preference capture", () => {
  it("succeeds without preference pair and still attempts capture with null", async () => {
    const supabase = {} as never;
    const admin = { admin: true } as never;
    const result = await submitFeedback(
      supabase,
      {
        runId: "run-1",
        tenantId: "t1",
        sourceKind: "human",
        feedbackCategory: "usefulness",
      },
      { adminClient: admin }
    );
    expect(result.success).toBe(true);
    expect(createFeedbackRecord).toHaveBeenCalled();
    expect(tryCaptureFeedbackPreferencePair).toHaveBeenCalledWith(admin, "t1", null);
  });

  it("returns error when run record missing (legacy clients unchanged contract)", async () => {
    vi.mocked(getRunRecordIdByRunId).mockResolvedValueOnce(null);
    const result = await submitFeedback({} as never, {
      runId: "missing",
      tenantId: "t1",
      sourceKind: "human",
      feedbackCategory: "usefulness",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Run record not found");
    }
  });

  it("calls capture with pair when provided", async () => {
    const pair = {
      taskType: "copilot",
      rejectedOutput: { text: "a" },
      chosenOutput: { text: "b" },
    };
    await submitFeedback(
      {} as never,
      {
        runId: "run-1",
        tenantId: "t1",
        sourceKind: "human",
        feedbackCategory: "usefulness",
        preferencePair: pair,
      },
      { adminClient: {} as never }
    );
    expect(tryCaptureFeedbackPreferencePair).toHaveBeenCalledWith({} as never, "t1", pair);
  });
});
