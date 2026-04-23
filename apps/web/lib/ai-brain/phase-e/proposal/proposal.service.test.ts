/**
 * AI Brain Phase E — Proposal service tests.
 */

import { describe, it, expect } from "vitest";
import { validateTargetLayer, validateRiskLevel } from "./proposal.service";

describe("proposal validation", () => {
  it("validateTargetLayer accepts valid layers", () => {
    expect(validateTargetLayer("prompt")).toBe(true);
    expect(validateTargetLayer("planner")).toBe(true);
    expect(validateTargetLayer("eval_config")).toBe(true);
  });

  it("validateTargetLayer rejects invalid", () => {
    expect(validateTargetLayer("other")).toBe(false);
  });

  it("validateRiskLevel accepts low, medium, high", () => {
    expect(validateRiskLevel("low")).toBe(true);
    expect(validateRiskLevel("medium")).toBe(true);
    expect(validateRiskLevel("high")).toBe(true);
  });
});
