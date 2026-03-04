import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { DB_ROLE_TO_ENTERPRISE } from "./authz.types";
import type { Permission } from "./authz.types";
import { ACTION_TO_PERMISSION } from "./authz.policy";
import * as repo from "./authz.repository";

/**
 * Resolve permission set for context (from role). Used to enrich TenantContext or check in authorize.
 */
export async function getPermissionsForContext(
  supabase: SupabaseClient,
  ctx: TenantContext
): Promise<Set<string>> {
  const roleName = DB_ROLE_TO_ENTERPRISE[ctx.role];
  if (!roleName) return new Set();
  const list = await repo.getPermissionsForRoleName(supabase, roleName);
  return new Set(list);
}

/**
 * Check if scope matches pattern. Pattern can be exact (project:xyz:*) or prefix (tenant:*).
 */
export function scopeMatches(scope: string, pattern: string): boolean {
  if (scope === pattern) return true;
  if (pattern.endsWith("*")) {
    const prefix = pattern.slice(0, -1);
    return scope.startsWith(prefix);
  }
  return false;
}

/**
 * Authorize: ctx must have permission and optionally scope.
 * If scopeRequired is provided, user must have that scope in user_scopes (or tenant:*).
 */
export async function authorize(
  supabase: SupabaseClient,
  ctx: TenantContext,
  permission: Permission,
  scopeRequired?: string
): Promise<boolean> {
  const permissions = await getPermissionsForContext(supabase, ctx);
  if (!permissions.has(permission)) return false;
  if (scopeRequired) {
    const scopes = await repo.getUserScopes(supabase, ctx.tenantId, ctx.userId);
    const hasTenantWildcard = scopes.some((s) => scopeMatches(s, "tenant:*"));
    if (hasTenantWildcard) return true;
    const hasResource = scopes.some((s) => scopeMatches(s, scopeRequired));
    return hasResource;
  }
  return true;
}

/**
 * Authorize by legacy ResourceAction (e.g. "project:create", "jobs:process").
 * Uses RBAC permission set; use in routes when supabase is available for strict checks.
 */
export async function authorizeAction(
  supabase: SupabaseClient,
  ctx: TenantContext,
  action: string
): Promise<boolean> {
  const permission = ACTION_TO_PERMISSION[action];
  if (!permission) return false;
  return authorize(supabase, ctx, permission);
}
