import { describe, expect, it } from "vitest";
import { portfolioReasonCell, portfolioReasonMessageKey } from "./portfolio-reason-label";

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

describe("portfolioReasonCell", () => {
  it("uses the same localized string for the visible cell and the tooltip", () => {
    const cell = portfolioReasonCell("Schedule: overdue milestones.", (key) =>
      key === "portfolioReasonSchedule" ? "График: просроченные вехи" : key,
    );
    expect(cell.text).toBe("График: просроченные вехи");
    expect(cell.title).toBe(cell.text);
    expect(cell.title).not.toBe("Schedule: overdue milestones.");
  });
});
