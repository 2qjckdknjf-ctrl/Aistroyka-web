/**
 * AI Brain Phase D — Improvement service tests.
 */

import { describe, it, expect, vi } from "vitest";
import {
  validateSource,
  validateTargetLayer,
  validateLinkedEvidenceRefs,
  candidateFromEvalFailure,
} from "./improvement.service";

describe("improvement validation", () => {
  describe("validateSource", () => {
    it("accepts feedback, eval, manual", () => {
      expect(validateSource("feedback")).toBe(true);
      expect(validateSource("eval")).toBe(true);
      expect(validateSource("manual")).toBe(true);
    });

    it("rejects invalid", () => {
      expect(validateSource("other")).toBe(false);
    });
  });

  describe("validateTargetLayer", () => {
    it("accepts valid layers", () => {
      expect(validateTargetLayer("prompt")).toBe(true);
      expect(validateTargetLayer("planner")).toBe(true);
      expect(validateTargetLayer("memory_retrieval")).toBe(true);
    });

    it("rejects invalid", () => {
      expect(validateTargetLayer("other")).toBe(false);
    });
  });

  describe("validateLinkedEvidenceRefs", () => {
    it("accepts valid refs", () => {
      const refs = validateLinkedEvidenceRefs([
        { type: "feedback", id: "f1" },
        { type: "eval", id: "e1" },
        { type: "run", id: "r1" },
      ]);
      expect(refs).toHaveLength(3);
    });

    it("filters invalid", () => {
      const refs = validateLinkedEvidenceRefs([
        { type: "feedback", id: "f1" },
        { type: "other", id: "x" },
      ]);
      expect(refs).toHaveLength(1);
    });
  });

  describe("candidateFromEvalFailure", () => {
    it("builds valid candidate input", () => {
      const c = candidateFromEvalFailure({
        evalRunId: "er1",
        caseId: "c1",
        caseTitle: "Test case",
        targetLayer: "planner",
        rationale: "Planner failed",
      });
      expect(c.source).toBe("eval");
      expect(c.targetLayer).toBe("planner");
      expect(c.rationale).toBe("Planner failed");
      expect(c.linkedEvidenceRefs).toHaveLength(2);
    });
  });
});
