import { describe, it, expect } from "vitest";
import { priorityForManagerSignal } from "./workload.governance";

describe("priorityForManagerSignal", () => {
  it("returns urgent for blocking defects", () => {
    expect(
      priorityForManagerSignal({
        blockingDefects: 1,
        budgetOverBudget: false,
        handoverBlockerCount: 0,
        overdueMilestones: 0,
        pendingDecisions: 0,
        aftercareOpen: 0,
      })
    ).toBe("urgent");
  });

  it("returns urgent for budget over", () => {
    expect(
      priorityForManagerSignal({
        blockingDefects: 0,
        budgetOverBudget: true,
        handoverBlockerCount: 0,
        overdueMilestones: 0,
        pendingDecisions: 0,
        aftercareOpen: 0,
      })
    ).toBe("urgent");
  });
});
