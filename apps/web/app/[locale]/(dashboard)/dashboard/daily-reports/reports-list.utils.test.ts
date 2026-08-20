import { describe, expect, it } from "vitest";
import { countPendingReportApprovals, reportStatusBadgeVariant, analysisStatusBadgeVariant, shouldPrioritizeReportDecision } from "./reports-list.utils";

describe("reports-list.utils", () => {
  it("counts submitted reports awaiting review", () => {
    expect(
      countPendingReportApprovals([
        { status: "submitted" },
        { status: "approved" },
        { status: "submitted" },
        { status: "draft" },
      ]),
    ).toBe(2);
  });

  it("maps report statuses to badge variants", () => {
    expect(reportStatusBadgeVariant("approved")).toBe("success");
    expect(reportStatusBadgeVariant("submitted")).toBe("warning");
    expect(reportStatusBadgeVariant("rejected")).toBe("danger");
    expect(reportStatusBadgeVariant("draft")).toBe("neutral");
  });

  it("maps analysis statuses to badge variants", () => {
    expect(analysisStatusBadgeVariant("success")).toBe("success");
    expect(analysisStatusBadgeVariant("failed")).toBe("danger");
    expect(analysisStatusBadgeVariant("running")).toBe("warning");
    expect(analysisStatusBadgeVariant("none")).toBe("neutral");
  });

  it("prioritizes decision column for submitted reports", () => {
    expect(shouldPrioritizeReportDecision("submitted")).toBe(true);
    expect(shouldPrioritizeReportDecision("approved")).toBe(false);
  });
});
