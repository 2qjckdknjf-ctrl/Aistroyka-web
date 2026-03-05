/**
 * RBAC helper for dashboard shell: whether to show Admin nav item.
 * Used by DashboardShell and by unit tests.
 */
export function getDashboardNavIncludesAdmin(isAdmin: boolean): boolean {
  return isAdmin;
}
