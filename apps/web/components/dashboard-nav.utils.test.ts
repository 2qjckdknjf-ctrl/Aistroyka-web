import { describe, expect, it } from "vitest";
import {
  DASHBOARD_NAV_GROUPS,
  flattenDashboardNavItems,
  getDashboardMobileNav,
  getDashboardNavGroups,
  getDashboardNavIncludesAdmin,
  getDashboardNavTestId,
  isDashboardNavHrefActive,
} from "./dashboard-nav.utils";

describe("dashboard nav canonical groups", () => {
  it("starts with overview and portfolio in command group", () => {
    const command = DASHBOARD_NAV_GROUPS.find((g) => g.id === "command");
    expect(command?.items[0]?.href).toBe("/dashboard");
    expect(command?.items[1]?.href).toBe("/portfolio");
  });

  it("keeps legacy flat destinations addressable", () => {
    const hrefs = flattenDashboardNavItems().map((item) => item.href);
    expect(hrefs).toContain("/dashboard/projects");
    expect(hrefs).toContain("/dashboard/ai");
    expect(hrefs).toContain("/dashboard/help");
  });

  it("maps stable pilot test ids", () => {
    expect(getDashboardNavTestId("projects")).toBe("cta.dashboard.nav.projects");
    expect(getDashboardNavTestId("adminPush")).toBe("cta.dashboard.nav.admin.push");
  });

  it("preserves admin gate helper", () => {
    expect(getDashboardNavIncludesAdmin(true)).toBe(true);
    expect(getDashboardNavIncludesAdmin(false)).toBe(false);
    expect(getDashboardNavIncludesAdmin(true, true)).toBe(false);
  });

  it("reduces portal-only nav to customer destinations", () => {
    const groups = getDashboardNavGroups(true);
    const hrefs = flattenDashboardNavItems(groups).map((item) => item.href);
    expect(hrefs).toEqual(["/portal/projects"]);
    expect(hrefs).not.toContain("/dashboard/tasks");
    expect(hrefs).not.toContain("/dashboard/help");
    expect(getDashboardMobileNav(true).map((item) => item.href)).toEqual(["/portal/projects"]);
  });

  it("marks client portal routes as the portal projects destination", () => {
    expect(isDashboardNavHrefActive("/portal/projects", "/portal/projects")).toBe(true);
    expect(isDashboardNavHrefActive("/dashboard/projects/abc/client", "/portal/projects")).toBe(true);
    expect(isDashboardNavHrefActive("/dashboard/projects", "/portal/projects")).toBe(false);
    expect(isDashboardNavHrefActive("/dashboard/projects/abc", "/dashboard")).toBe(false);
  });
});
