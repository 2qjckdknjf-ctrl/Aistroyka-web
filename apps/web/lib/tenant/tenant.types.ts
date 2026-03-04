/**
 * Tenant context and role types.
 * Aligned with SPEC-TENANT-MODEL (OWNER, MANAGER, WORKER, CONTRACTOR).
 * DB uses owner | admin | member | viewer; we use DB roles here.
 */

export type TenantRoleSpec = "OWNER" | "MANAGER" | "WORKER" | "CONTRACTOR";
export type TenantRoleDb = "owner" | "admin" | "member" | "viewer";

export type ClientProfile = "web" | "ios_full" | "ios_lite" | "android_full" | "android_lite";

export interface TenantContext {
  tenantId: string;
  userId: string;
  role: TenantRoleDb;
  subscriptionTier: string;
  clientProfile: ClientProfile;
  traceId: string;
}

export interface TenantContextAbsent {
  tenantId: null;
  userId: string | null;
  role: null;
  subscriptionTier: null;
  clientProfile: ClientProfile;
  traceId: string;
}

export type TenantContextOrAbsent = TenantContext | TenantContextAbsent;

export function isTenantContextPresent(ctx: TenantContextOrAbsent): ctx is TenantContext {
  return ctx.tenantId !== null && ctx.role !== null;
}
