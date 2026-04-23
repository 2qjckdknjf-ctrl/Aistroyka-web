/**
 * AI Brain Phase D — Feedback service tests.
 */

import { describe, it, expect, vi } from "vitest";
import {
  validateFeedbackCategory,
  validateSourceKind,
  validateScore,
  validateLinkedRefs,
} from "./feedback.service";

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
