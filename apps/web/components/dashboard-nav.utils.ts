/**
 * Dashboard shell navigation — canonical IA groups (redesign 2026-08-19).
 * Routes and RBAC unchanged; presentation only.
 */

export type DashboardNavKey =
  | "overview"
  | "portfolio"
  | "projects"
  | "tasks"
  | "reports"
  | "approvals"
  | "workers"
  | "contractors"
  | "uploads"
  | "devices"
  | "ai"
  | "alerts"
  | "support"
  | "authSettings"
  | "helpCenter"
  | "adminPush"
  | "adminJobs";

export type DashboardNavGroupId = "command" | "operations" | "intelligence" | "settings" | "portal";

export type DashboardNavLabelKey = "dashboard" | "portalProjects" | DashboardNavKey;

export type DashboardNavItem = {
  href: string;
  key: DashboardNavKey;
  /** nav.* label key override when href label differs from key */
  labelKey?: DashboardNavLabelKey;
};

export type DashboardNavGroup = {
  id: DashboardNavGroupId;
  labelKey:
    | "navGroupCommand"
    | "navGroupOperations"
    | "navGroupIntelligence"
    | "navGroupSettings"
    | "navGroupPortal";
  items: DashboardNavItem[];
};

export const DASHBOARD_NAV_GROUPS: DashboardNavGroup[] = [
  {
    id: "command",
    labelKey: "navGroupCommand",
    items: [
      { href: "/dashboard", key: "overview", labelKey: "dashboard" },
      { href: "/portfolio", key: "portfolio" },
      { href: "/dashboard/projects", key: "projects" },
      { href: "/dashboard/tasks", key: "tasks" },
      { href: "/dashboard/reports", key: "reports" },
      { href: "/dashboard/approvals", key: "approvals" },
    ],
  },
  {
    id: "operations",
    labelKey: "navGroupOperations",
    items: [
      { href: "/dashboard/workers", key: "workers" },
      { href: "/dashboard/contractors", key: "contractors" },
      { href: "/dashboard/uploads", key: "uploads" },
      { href: "/dashboard/devices", key: "devices" },
    ],
  },
  {
    id: "intelligence",
    labelKey: "navGroupIntelligence",
    items: [
      { href: "/dashboard/ai", key: "ai" },
      { href: "/dashboard/alerts", key: "alerts" },
    ],
  },
  {
    id: "settings",
    labelKey: "navGroupSettings",
    items: [
      { href: "/dashboard/support", key: "support" },
      { href: "/dashboard/settings/auth", key: "authSettings" },
      { href: "/dashboard/help", key: "helpCenter" },
    ],
  },
];

/** Portal-only stakeholders: destinations that middleware already allows. */
export const PORTAL_NAV_GROUPS: DashboardNavGroup[] = [
  {
    id: "portal",
    labelKey: "navGroupPortal",
    items: [{ href: "/portal/projects", key: "projects", labelKey: "portalProjects" }],
  },
];

export type DashboardMobileNavItem = {
  href: string;
  labelKey: DashboardNavLabelKey;
  testId: DashboardNavKey;
};

export const DASHBOARD_MOBILE_NAV: readonly DashboardMobileNavItem[] = [
  { href: "/dashboard", labelKey: "dashboard", testId: "overview" },
  { href: "/dashboard/projects", labelKey: "projects", testId: "projects" },
  { href: "/dashboard/tasks", labelKey: "tasks", testId: "tasks" },
  { href: "/dashboard/reports", labelKey: "reports", testId: "reports" },
  { href: "/dashboard/help", labelKey: "helpCenter", testId: "helpCenter" },
];

export const PORTAL_MOBILE_NAV: readonly DashboardMobileNavItem[] = [
  { href: "/portal/projects", labelKey: "portalProjects", testId: "projects" },
];

export function getDashboardNavGroups(portalOnly = false): DashboardNavGroup[] {
  return portalOnly ? PORTAL_NAV_GROUPS : DASHBOARD_NAV_GROUPS;
}

export function getDashboardMobileNav(portalOnly = false): readonly DashboardMobileNavItem[] {
  return portalOnly ? PORTAL_MOBILE_NAV : DASHBOARD_MOBILE_NAV;
}

export function isDashboardNavHrefActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/portfolio") {
    return pathname === "/portfolio" || pathname.startsWith("/portfolio/");
  }
  if (href === "/portal/projects") {
    return (
      pathname === "/portal/projects" ||
      pathname.startsWith("/portal/projects/") ||
      /^\/dashboard\/projects\/[^/]+\/client(\/|$)/.test(pathname)
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getDashboardNavIncludesAdmin(isAdmin: boolean, portalOnly = false): boolean {
  return isAdmin && !portalOnly;
}

export function getDashboardNavTestId(key: DashboardNavKey): string {
  if (key === "adminPush") return "cta.dashboard.nav.admin.push";
  if (key === "adminJobs") return "cta.dashboard.nav.admin.jobs";
  return `cta.dashboard.nav.${key}`;
}

export function flattenDashboardNavItems(groups: DashboardNavGroup[] = DASHBOARD_NAV_GROUPS): DashboardNavItem[] {
  return groups.flatMap((group) => group.items);
}
