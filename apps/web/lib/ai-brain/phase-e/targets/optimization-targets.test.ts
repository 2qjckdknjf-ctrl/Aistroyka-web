/**
 * AI Brain Phase E — Optimization targets tests.
 */

import { describe, it, expect } from "vitest";
import {
  getTargetDefinition,
  validateTargetLayer,
  OPTIMIZATION_TARGET_DEFINITIONS,
} from "./optimization-targets";

describe("optimization targets", () => {
  it("has definitions for all target layers", () => {
    expect(OPTIMIZATION_TARGET_DEFINITIONS.length).toBeGreaterThan(0);
  });

  it("getTargetDefinition returns definition for valid layer", () => {
    const def = getTargetDefinition("planner");
    expect(def).not.toBeNull();
    expect(def?.layer).toBe("planner");
    expect(def?.guardrails).toContain("degradation_preserved");
  });

  it("getTargetDefinition returns null for invalid layer", () => {
    expect(getTargetDefinition("invalid" as "planner")).toBeNull();
  });

  it("validateTargetLayer accepts valid layers", () => {
    expect(validateTargetLayer("prompt")).toBe(true);
    expect(validateTargetLayer("policy")).toBe(true);
    expect(validateTargetLayer("eval_config")).toBe(true);
  });

  it("validateTargetLayer rejects invalid", () => {
    expect(validateTargetLayer("other")).toBe(false);
  });
});
