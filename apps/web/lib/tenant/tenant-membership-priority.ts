import type { TenantRoleDb } from "./tenant.types";

const TENANT_ROLE_RANK: Record<TenantRoleDb, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
  stakeholder: 0,
};

const TENANT_MEMBER_ROLES: readonly TenantRoleDb[] = [
  "owner",
  "admin",
  "member",
  "viewer",
  "stakeholder",
];

export function isTenantMemberRole(role: string): role is TenantRoleDb {
  return (TENANT_MEMBER_ROLES as readonly string[]).includes(role);
}

export type PrimaryTenantMembership = {
  tenant_id: string;
  role: TenantRoleDb;
};

/**
 * Choose the user's primary workspace membership.
 * Internal roles always beat portal-only `stakeholder` so a contractor who is
 * also invited as a client stakeholder cannot lose cabinet access to an
 * unordered `limit(1)` row.
 */
export function pickPrimaryTenantMembership(
  rows: ReadonlyArray<{ tenant_id?: string | null; role?: string | null }>
): PrimaryTenantMembership | null {
  let best: PrimaryTenantMembership | null = null;
  let bestRank = -1;
  for (const row of rows) {
    const tenantId = row.tenant_id;
    const role = row.role;
    if (typeof tenantId !== "string" || tenantId.length === 0) continue;
    if (typeof role !== "string" || !isTenantMemberRole(role)) continue;
    const rank = TENANT_ROLE_RANK[role];
    if (rank > bestRank) {
      best = { tenant_id: tenantId, role };
      bestRank = rank;
    }
  }
  return best;
}
