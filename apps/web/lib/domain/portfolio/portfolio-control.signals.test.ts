import { describe, it, expect } from "vitest";
import {
  classifyPortfolioControlState,
  pickTopBlockerCategory,
  drilldownHrefForCategory,
} from "./portfolio-control.signals";

describe("classifyPortfolioControlState", () => {
  it("returns critical when over budget", () => {
    expect(
      classifyPortfolioControlState({
        derivedHealthLevel: "good",
        budgetOverBudget: true,
        blockingDefectsCount: 0,
        handoverBlockerCount: 0,
        overdueMilestonesCount: 0,
        activeAftercareCount: 0,
        pendingApprovalsCount: 0,
        pendingClientRequestsCount: 0,
      })
    ).toBe("critical");
  });

  it("returns critical when blocking punch defects", () => {
    expect(
      classifyPortfolioControlState({
        derivedHealthLevel: "good",
        budgetOverBudget: false,
        blockingDefectsCount: 1,
        handoverBlockerCount: 0,
        overdueMilestonesCount: 0,
        activeAftercareCount: 0,
        pendingApprovalsCount: 0,
        pendingClientRequestsCount: 0,
      })
    ).toBe("critical");
  });

  it("returns attention when health warning", () => {
    expect(
      classifyPortfolioControlState({
        derivedHealthLevel: "warning",
        budgetOverBudget: false,
        blockingDefectsCount: 0,
        handoverBlockerCount: 0,
        overdueMilestonesCount: 0,
        activeAftercareCount: 0,
        pendingApprovalsCount: 0,
        pendingClientRequestsCount: 0,
      })
    ).toBe("attention");
  });

  it("returns healthy when no pressures", () => {
    expect(
      classifyPortfolioControlState({
        derivedHealthLevel: "good",
        budgetOverBudget: false,
        blockingDefectsCount: 0,
        handoverBlockerCount: 0,
        overdueMilestonesCount: 0,
        activeAftercareCount: 0,
        pendingApprovalsCount: 0,
        pendingClientRequestsCount: 0,
      })
    ).toBe("healthy");
  });
});

describe("pickTopBlockerCategory", () => {
  it("prefers budget when over budget", () => {
    expect(
      pickTopBlockerCategory({
        budgetOverBudget: true,
        budgetNearingLimit: false,
        blockingDefectsCount: 2,
        overdueMilestonesCount: 5,
        pendingApprovalsCount: 1,
        pendingClientRequestsCount: 0,
        openChangeOrdersCount: 0,
        openDiscussionsCount: 0,
        activeAftercareCount: 0,
        openIssuesCount: 0,
        pendingReportApprovalsCount: 0,
        handoverBlockerCount: 0,
      })
    ).toBe("budget");
  });

  it("prefers punch list when no budget issue", () => {
    expect(
      pickTopBlockerCategory({
        budgetOverBudget: false,
        budgetNearingLimit: false,
        blockingDefectsCount: 1,
        overdueMilestonesCount: 0,
        pendingApprovalsCount: 0,
        pendingClientRequestsCount: 0,
        openChangeOrdersCount: 0,
        openDiscussionsCount: 0,
        activeAftercareCount: 0,
        openIssuesCount: 0,
        pendingReportApprovalsCount: 0,
        handoverBlockerCount: 0,
      })
    ).toBe("punch_list");
  });
});

describe("drilldownHrefForCategory", () => {
  it("maps aftercare to tab", () => {
    expect(drilldownHrefForCategory("p1", "aftercare")).toContain("tab=aftercare");
  });
});
