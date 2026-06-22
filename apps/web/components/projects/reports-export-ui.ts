import type { TenantRoleDb } from "@/lib/tenant/tenant.types";

export function canShowProjectReportsExport(role: TenantRoleDb | null | undefined): boolean {
  return role === "owner" || role === "admin";
}

export function buildProjectReportsExportHref(projectId: string): string {
  return `/api/v1/reports/export?project_id=${encodeURIComponent(projectId)}`;
}
