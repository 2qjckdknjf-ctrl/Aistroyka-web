/**
 * Tenant context and role types.
 * Aligned with SPEC-TENANT-MODEL (OWNER, MANAGER, WORKER, CONTRACTOR).
 * DB uses owner | admin | member | viewer; we use DB roles here.
 */

export type TenantRoleSpec = "OWNER" | "MANAGER" | "WORKER" | "CONTRACTOR";
export type TenantRoleDb = "owner" | "admin" | "member" | "viewer" | "stakeholder";

export type ClientProfile =
  | "web"
  | "ios_full"
  | "ios_lite"
  | "ios_worker"
  | "ios_manager"
  | "android_full"
  | "android_lite"
  | "android_worker"
  | "android_manager";

/** Permission keys from RBAC (read, write, create, ...). Populated when context is built with authz. */
export type PermissionKey = string;

export interface TenantContext {
  tenantId: string;
  userId: string;
  role: TenantRoleDb;
  subscriptionTier: string;
  clientProfile: ClientProfile;
  traceId: string;
  /** RBAC permission set (from role). Set when context is resolved with authz. */
  permissionSet?: Set<PermissionKey>;
  /** Resource scopes (e.g. tenant:*, project:id:*). Set when context is resolved with authz. */
  scopes?: string[];
}

export interface TenantContextAbsent {
  tenantId: null;
  userId: string | null;
  role: null;
  subscriptionTier: null;
  clientProfile: ClientProfile;
  traceId: string;
  /** Set when field-worker x-client is denied by lite allow-list (handler-level). */
  litePathForbidden?: boolean;
}

export type TenantContextOrAbsent = TenantContext | TenantContextAbsent;

export function isTenantContextPresent(ctx: TenantContextOrAbsent): ctx is TenantContext {
  return ctx.tenantId !== null && ctx.role !== null;
}

export function isLitePathForbiddenContext(
  ctx: TenantContextOrAbsent
): ctx is TenantContextAbsent & { litePathForbidden: true } {
  return ctx.tenantId === null && ctx.litePathForbidden === true;
}
