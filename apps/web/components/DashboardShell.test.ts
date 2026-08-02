/**
 * Phase 3C — portal-only shell derived from active-tenant role (not pathname).
 */

import { describe, expect, it } from "vitest";
import {
  dashboardNavPrivilegesAlign,
  getDashboardNavIncludesAdmin,
  getDashboardNavIncludesInternalOps,
  getDashboardNavIncludesTeam,
  getDashboardShellHomeHref,
  getPortalOnlyNavItems,
  isPortalOnlyShellFromRole,
} from "./dashboard-nav.utils";

describe("portal-only shell contract (Phase 3C)", () => {
  it("derives portal-only from stakeholder role only", () => {
    expect(isPortalOnlyShellFromRole("stakeholder")).toBe(true);
    expect(isPortalOnlyShellFromRole("owner")).toBe(false);
    expect(isPortalOnlyShellFromRole("admin")).toBe(false);
    expect(isPortalOnlyShellFromRole("member")).toBe(false);
    expect(isPortalOnlyShellFromRole(null)).toBe(false);
  });

  it("portal nav exposes only portal-safe destinations", () => {
    const items = getPortalOnlyNavItems();
    expect(items).toHaveLength(1);
    expect(items[0]?.href).toBe("/portal/projects");
    for (const item of items) {
      expect(item.href.startsWith("/portal")).toBe(true);
      expect(item.href).not.toMatch(/\/(admin|billing|portfolio|team|workers|costs)/);
    }
  });

  it("hides internal ops chrome and admin/team for portal-only", () => {
    expect(getDashboardNavIncludesInternalOps(true)).toBe(false);
    expect(getDashboardNavIncludesAdmin(true, true)).toBe(false);
    expect(getDashboardNavIncludesTeam(true, true)).toBe(false);
    expect(getDashboardShellHomeHref(true)).toBe("/portal/projects");
  });

  it("keeps internal persona shell unchanged when not portal-only", () => {
    expect(getDashboardNavIncludesInternalOps(false)).toBe(true);
    expect(getDashboardNavIncludesAdmin(true, false)).toBe(true);
    expect(getDashboardNavIncludesTeam(true, false)).toBe(true);
    expect(getDashboardShellHomeHref(false)).toBe("/dashboard");
    expect(dashboardNavPrivilegesAlign(true, true)).toBe(true);
  });
});
