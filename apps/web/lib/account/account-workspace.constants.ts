import type { AccountMemberRole } from "./account.types";

/** Tenant roles that map to account_members on invite accept (Stage 2.2). */
export const ACCOUNT_MEMBER_ELIGIBLE_TENANT_ROLES = [
  "owner",
  "admin",
  "member",
  "viewer",
] as const satisfies readonly AccountMemberRole[];

export type AccountMemberEligibleTenantRole = (typeof ACCOUNT_MEMBER_ELIGIBLE_TENANT_ROLES)[number];

export function isAccountMemberEligibleTenantRole(
  role: string
): role is AccountMemberEligibleTenantRole {
  return (ACCOUNT_MEMBER_ELIGIBLE_TENANT_ROLES as readonly string[]).includes(role);
}

export function tenantAccountSlug(tenantId: string): string {
  return `t-${tenantId.replace(/-/g, "")}`;
}
