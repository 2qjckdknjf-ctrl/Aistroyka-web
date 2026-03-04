import { describe, expect, it } from "vitest";
import { canCreateReport } from "./report.policy";

describe("report.policy", () => {
  const ctx = (role: string) => ({ tenantId: "t", userId: "u", role, subscriptionTier: "free", clientProfile: "web", traceId: "x" });
  it("allows member and above", () => {
    expect(canCreateReport(ctx("member"))).toBe(true);
    expect(canCreateReport(ctx("admin"))).toBe(true);
  });
  it("denies viewer", () => {
    expect(canCreateReport(ctx("viewer"))).toBe(false);
  });
});
