/**
 * RBAC helpers for dashboard shell navigation visibility.
 * Admin and team links must mirror the *active-tenant* admin check
 * (same boolean the server layout computes via requireAdmin + headers).
 * Portal-only shell is derived from active-tenant role === stakeholder (not pathname).
 */

export type PortalShellNavItem = {
  href: "/portal/projects";
  key: "portalProjects";
  testId: "cta.portal.nav.projects";
};

export function isPortalOnlyShellFromRole(role: string | null | undefined): boolean {
  return role === "stakeholder";
}

/** Stakeholder shell: portal projects only — no internal ops destinations. */
export function getPortalOnlyNavItems(): readonly PortalShellNavItem[] {
  return [
    {
      href: "/portal/projects",
      key: "portalProjects",
      testId: "cta.portal.nav.projects",
    },
  ] as const;
}

export function getDashboardNavIncludesAdmin(isAdmin: boolean, portalOnly = false): boolean {
  return !portalOnly && isAdmin;
}

export function getDashboardNavIncludesTeam(canManageTeam: boolean, portalOnly = false): boolean {
  return !portalOnly && canManageTeam;
}

export function getDashboardNavIncludesInternalOps(portalOnly: boolean): boolean {
  return !portalOnly;
}

export function getDashboardShellHomeHref(portalOnly: boolean): "/portal/projects" | "/dashboard" {
  return portalOnly ? "/portal/projects" : "/dashboard";
}

/**
 * Contract: admin nav and team nav are both driven by active-tenant owner/admin.
 * They must agree when the layout passes the same active-tenant result to both props.
 */
export function dashboardNavPrivilegesAlign(isAdmin: boolean, canManageTeam: boolean): boolean {
  return isAdmin === canManageTeam;
}
