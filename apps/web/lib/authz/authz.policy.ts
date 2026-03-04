/**
 * Policy helpers: map legacy ResourceAction to permission + optional scope,
 * and provide synchronous fallback when supabase not available (role-order only).
 */

import type { TenantContext } from "@/lib/tenant/tenant.types";
import type { Permission } from "./authz.types";

/** Legacy action to permission mapping. Scope is usually tenant-wide. */
export const ACTION_TO_PERMISSION: Record<string, Permission> = {
  "tenant:settings": "write",
  "tenant:invite": "invite",
  "project:create": "create",
  "project:read": "read",
  "project:update": "write",
  "project:delete": "delete",
  "media:upload": "create",
  "media:read": "read",
  "analysis:trigger": "ai_admin",
  "reports:read": "read",
  "admin:read": "read",
  "jobs:process": "ai_admin",
};

/** Synchronous role-order check (backward compatible when authz DB not used). */
const ROLE_ORDER: Record<string, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
};

export function authorizeByRoleOnly(ctx: TenantContext, minRole: "owner" | "admin" | "member" | "viewer"): boolean {
  const level = ROLE_ORDER[ctx.role] ?? 0;
  return level >= ROLE_ORDER[minRole];
}

/** Minimum role for legacy actions (for sync fallback). */
export function minRoleForAction(action: string): "owner" | "admin" | "member" | "viewer" {
  switch (action) {
    case "tenant:settings":
    case "tenant:invite":
      return "admin";
    case "project:create":
    case "project:update":
    case "project:delete":
    case "media:upload":
    case "analysis:trigger":
      return "member";
    case "project:read":
    case "media:read":
    case "reports:read":
      return "viewer";
    case "admin:read":
    case "jobs:process":
      return "admin";
    default:
      return "owner";
  }
}
