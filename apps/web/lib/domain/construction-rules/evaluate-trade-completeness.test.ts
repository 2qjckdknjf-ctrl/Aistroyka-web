import { describe, expect, it } from "vitest";
import { evaluateTradeCompleteness } from "./evaluate-trade-completeness";
import { WATERPROOFING_COMPLETENESS_TEMPLATE_V1 } from "./waterproofing-completeness.template";
import type { EvidenceInventoryItem } from "./trade-completeness.types";

function present(
  evidenceKind: EvidenceInventoryItem["evidenceKind"],
  sourceRef = "src-1"
): EvidenceInventoryItem {
  return { evidenceKind, status: "present", sourceRef };
}

describe("AIS-RULE-015 evaluateTradeCompleteness", () => {
  it("returns INSUFFICIENT_EVIDENCE and questions when required evidence missing", () => {
    const result = evaluateTradeCompleteness(WATERPROOFING_COMPLETENESS_TEMPLATE_V1, [
      present("contract_scope"),
    ]);
    expect(result.verdict).toBe("INSUFFICIENT_EVIDENCE");
    expect(result.missingRequiredCount).toBeGreaterThan(0);
    expect(result.questions.length).toBeGreaterThan(0);
    expect(result.items.some((i) => i.status === "missing")).toBe(true);
    expect(JSON.stringify(result)).not.toMatch(/PASS/i);
  });

  it("returns ABSTAIN when required present but recommended missing", () => {
    const required = WATERPROOFING_COMPLETENESS_TEMPLATE_V1.requirements
      .filter((r) => r.severity === "required")
      .map((r) => present(r.evidenceKind, r.id));
    const result = evaluateTradeCompleteness(WATERPROOFING_COMPLETENESS_TEMPLATE_V1, required);
    expect(result.verdict).toBe("ABSTAIN");
    expect(result.missingRequiredCount).toBe(0);
    expect(result.missingRecommendedCount).toBeGreaterThan(0);
  });

  it("returns READY_FOR_HUMAN_REVIEW when checklist complete — never PASS", () => {
    const all = WATERPROOFING_COMPLETENESS_TEMPLATE_V1.requirements.map((r) =>
      present(r.evidenceKind, r.id)
    );
    const result = evaluateTradeCompleteness(WATERPROOFING_COMPLETENESS_TEMPLATE_V1, all);
    expect(result.verdict).toBe("READY_FOR_HUMAN_REVIEW");
    expect(result.missingRequiredCount).toBe(0);
    expect(result.missingRecommendedCount).toBe(0);
    expect(result.questions).toEqual([]);
    expect(result.verdict).not.toBe("PASS" as never);
  });

  it("marks unverified required as insufficient and asks for verification", () => {
    const inventory: EvidenceInventoryItem[] = WATERPROOFING_COMPLETENESS_TEMPLATE_V1.requirements
      .filter((r) => r.severity === "required")
      .map((r, index) =>
        index === 0
          ? { evidenceKind: r.evidenceKind, status: "unverified", sourceRef: "weak" }
          : present(r.evidenceKind, r.id)
      );
    const result = evaluateTradeCompleteness(WATERPROOFING_COMPLETENESS_TEMPLATE_V1, inventory);
    expect(result.verdict).toBe("INSUFFICIENT_EVIDENCE");
    expect(result.items.some((i) => i.status === "unverified")).toBe(true);
  });

  it("returns NEEDS_REVIEW on conflicting required evidence", () => {
    const inventory: EvidenceInventoryItem[] = WATERPROOFING_COMPLETENESS_TEMPLATE_V1.requirements
      .filter((r) => r.severity === "required")
      .map((r, index) =>
        index === 0
          ? { evidenceKind: r.evidenceKind, status: "conflicting", sourceRef: "a|b" }
          : present(r.evidenceKind, r.id)
      );
    const result = evaluateTradeCompleteness(WATERPROOFING_COMPLETENESS_TEMPLATE_V1, inventory);
    expect(result.verdict).toBe("NEEDS_REVIEW");
  });
});
