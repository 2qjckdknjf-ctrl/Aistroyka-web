import { describe, it, expect } from "vitest";
import { getDashboardNavIncludesAdmin } from "./dashboard-nav.utils";

describe("DashboardShell RBAC gating", () => {
  it("includes Admin nav when isAdmin is true", () => {
    expect(getDashboardNavIncludesAdmin(true)).toBe(true);
  });

  it("excludes Admin nav when isAdmin is false", () => {
    expect(getDashboardNavIncludesAdmin(false)).toBe(false);
  });
});
