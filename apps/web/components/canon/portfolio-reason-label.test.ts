import { describe, expect, it } from "vitest";
import { portfolioReasonMessageKey } from "./portfolio-reason-label";

describe("portfolioReasonMessageKey", () => {
  it("maps known English signals and leaves unknown text unmapped", () => {
    expect(portfolioReasonMessageKey("Schedule: overdue milestones.")).toBe("portfolioReasonSchedule");
    expect(portfolioReasonMessageKey("No major operational pressures from current signals.")).toBe(
      "portfolioReasonHealthy",
    );
    expect(portfolioReasonMessageKey("A custom note")).toBeNull();
    expect(portfolioReasonMessageKey(null)).toBeNull();
  });
});
