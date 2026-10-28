import { describe, expect, it } from "vitest";
import {
  assertAiAnalysisGraphEligible,
  isAiAnalysisGraphEligible,
  parseAiAnalysisReviewStatus,
} from "./review-status";

describe("ai analysis review status", () => {
  it("parses known statuses and rejects unknown", () => {
    expect(parseAiAnalysisReviewStatus("accepted")).toBe("accepted");
    expect(parseAiAnalysisReviewStatus("INSUFFICIENT_EVIDENCE")).toBe("insufficient_evidence");
    expect(parseAiAnalysisReviewStatus("pending")).toBe("pending");
    expect(parseAiAnalysisReviewStatus("edited")).toBeNull();
    expect(parseAiAnalysisReviewStatus(1)).toBeNull();
  });

  it("marks only accepted as Graph-eligible", () => {
    expect(isAiAnalysisGraphEligible("accepted")).toBe(true);
    expect(isAiAnalysisGraphEligible("pending")).toBe(false);
    expect(isAiAnalysisGraphEligible("rejected")).toBe(false);
    expect(isAiAnalysisGraphEligible("insufficient_evidence")).toBe(false);
    expect(isAiAnalysisGraphEligible(null)).toBe(false);
  });

  it("assert fails closed for non-accepted statuses", () => {
    expect(() => assertAiAnalysisGraphEligible("accepted")).not.toThrow();
    expect(() => assertAiAnalysisGraphEligible("pending")).toThrow(/AI_ANALYSIS_NOT_GRAPH_ELIGIBLE/);
  });
});
