/**
 * Resolve resource type + id to dashboard href for drill-down.
 * Used by manager action layer and intelligence components.
 */

export function getResourceHref(
  resourceType: string,
  resourceId: string,
  projectId?: string
): string | null {
  switch (resourceType) {
    case "task":
      return `/dashboard/tasks/${resourceId}`;
    case "report":
      return `/dashboard/daily-reports/${resourceId}`;
    case "project":
      return `/dashboard/projects/${resourceId}`;
    case "worker_day":
      return `/dashboard/daily-reports`;
    case "project_risk":
      return projectId ? `/dashboard/projects/${projectId}` : null;
    case "project_milestone":
      return projectId ? `/dashboard/projects/${projectId}?tab=schedule` : null;
    default:
      return null;
  }
}
