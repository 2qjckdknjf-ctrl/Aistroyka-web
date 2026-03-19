import { describe, expect, it } from "vitest";
import { canCreateReport, canReviewReport } from "./report.policy";

describe("report.policy", () => {
  const ctx = (role: string) => ({ tenantId: "t", userId: "u", role, subscriptionTier: "free", clientProfile: "web", traceId: "x" });
  it("canCreateReport allows member and above", () => {
    expect(canCreateReport(ctx("member"))).toBe(true);
    expect(canCreateReport(ctx("admin"))).toBe(true);
  });
  it("canCreateReport denies viewer", () => {
    expect(canCreateReport(ctx("viewer"))).toBe(false);
  });
  it("canReviewReport allows member and above (same as canManageProjects)", () => {
    expect(canReviewReport(ctx("owner"))).toBe(true);
    expect(canReviewReport(ctx("admin"))).toBe(true);
    expect(canReviewReport(ctx("member"))).toBe(true);
    expect(canReviewReport(ctx("viewer"))).toBe(false);
  });
});
