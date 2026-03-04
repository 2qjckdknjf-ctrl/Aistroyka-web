/**
 * Enterprise RBAC + resource scopes.
 * Roles: OWNER, MANAGER, WORKER, CONTRACTOR (tenant-level).
 * DB tenant_members.role (owner|admin|member|viewer) maps to these.
 */

export type RoleName = "OWNER" | "MANAGER" | "WORKER" | "CONTRACTOR";

export type Permission =
  | "read"
  | "write"
  | "create"
  | "delete"
  | "approve"
  | "assign"
  | "invite"
  | "export"
  | "billing_admin"
  | "ai_admin";

/** Resource scope patterns: tenant:*, project:{id}:*, task:{id}:*, report:{id}:*, media:{id}:* */
export type ScopePattern = string;

/** Map from DB role (tenant_members.role) to enterprise role name. */
export const DB_ROLE_TO_ENTERPRISE: Record<string, RoleName> = {
  owner: "OWNER",
  admin: "MANAGER",
  member: "WORKER",
  viewer: "CONTRACTOR",
};
