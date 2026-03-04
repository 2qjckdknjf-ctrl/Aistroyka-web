/**
 * Role-based authorization. Aligned with SPEC-TENANT-MODEL matrix.
 * owner > admin > member > viewer.
 */

import type { TenantContext } from "./tenant.types";

const ROLE_ORDER: Record<string, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
};

export type ResourceAction =
  | "tenant:settings"
  | "tenant:invite"
  | "project:create"
  | "project:read"
  | "project:update"
  | "project:delete"
  | "media:upload"
  | "media:read"
  | "analysis:trigger"
  | "reports:read"
  | "admin:read";

/**
 * Returns true if the tenant context has at least the required role for the action.
 */
export function authorize(ctx: TenantContext, action: ResourceAction): boolean {
  const roleLevel = ROLE_ORDER[ctx.role] ?? 0;
  const required = minRoleForAction(action);
  return roleLevel >= required;
}

function minRoleForAction(action: ResourceAction): number {
  switch (action) {
    case "tenant:settings":
    case "tenant:invite":
      return ROLE_ORDER.admin;
    case "project:create":
    case "project:update":
    case "project:delete":
    case "media:upload":
    case "analysis:trigger":
      return ROLE_ORDER.member;
    case "project:read":
    case "media:read":
    case "reports:read":
      return ROLE_ORDER.viewer;
    case "admin:read":
      return ROLE_ORDER.admin;
    default:
      return 999;
  }
}

/**
 * Check at least member (create projects, upload, run analysis).
 */
export function canManageProjects(ctx: TenantContext): boolean {
  return authorize(ctx, "project:create");
}

/**
 * Check at least viewer (read projects, media, reports).
 */
export function canReadProjects(ctx: TenantContext): boolean {
  return authorize(ctx, "project:read");
}
