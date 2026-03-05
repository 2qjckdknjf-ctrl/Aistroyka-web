import { describe, expect, it } from "vitest";
import { consumedErrorBudget, DEFAULT_AVAILABILITY_TARGET } from "./error-budget.service";

describe("error-budget.service", () => {
  it("returns 0 when no requests", () => {
    expect(consumedErrorBudget(0, 0, 0.999)).toBe(0);
  });

  it("returns 0 when requests positive and no errors", () => {
    expect(consumedErrorBudget(100, 0, 0.999)).toBe(0);
  });

  it("consumes budget when errors present", () => {
    const c = consumedErrorBudget(1000, 1, 0.999);
    expect(c).toBeGreaterThan(0);
    expect(c).toBeLessThanOrEqual(1);
  });

  it("uses default target when not provided", () => {
    expect(DEFAULT_AVAILABILITY_TARGET).toBe(0.999);
  });
});
