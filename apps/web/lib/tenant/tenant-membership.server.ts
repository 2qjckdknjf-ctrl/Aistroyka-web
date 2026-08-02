/**
 * Canonical tenant membership role helpers (includes stakeholder).
 * Replaces legacy `lib/auth/tenant.ts` which omitted stakeholder from the role union.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSessionUser } from "@/lib/supabase/server";
import type { TenantRoleDb } from "./tenant.types";

/** Operational hierarchy ranks. Stakeholder is portal-only (rank 0) — never satisfies viewer+. */
const ROLE_ORDER: Record<TenantRoleDb, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
  stakeholder: 0,
};

const TENANT_ROLES: readonly TenantRoleDb[] = [
  "owner",
  "admin",
  "member",
  "viewer",
  "stakeholder",
] as const;

export function isTenantRoleDb(value: string): value is TenantRoleDb {
  return (TENANT_ROLES as readonly string[]).includes(value);
}

export function roleAtLeast(role: TenantRoleDb, minRequired: TenantRoleDb): boolean {
  return ROLE_ORDER[role] >= ROLE_ORDER[minRequired];
}

/**
 * Returns the current user's role in the tenant, or null if no access.
 * Recognizes `stakeholder` (unlike legacy `lib/auth/tenant.ts`).
 * Returns null on any error so callers fail closed.
 */
export async function getRoleInTenant(
  supabase: SupabaseClient,
  tenantId: string
): Promise<TenantRoleDb | null> {
  try {
    const user = await getSessionUser(supabase);
    if (!user?.id) return null;

    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("user_id")
      .eq("id", tenantId)
      .maybeSingle();
    if (tenantError) return null;

    if (tenant?.user_id === user.id) return "owner";

    const { data: member, error: memberError } = await supabase
      .from("tenant_members")
      .select("role")
      .eq("tenant_id", tenantId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (memberError) return null;

    if (member?.role && isTenantRoleDb(String(member.role))) {
      return member.role as TenantRoleDb;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * True if the current user has at least `minRole` in the tenant.
 * Stakeholders never satisfy viewer/member/admin/owner thresholds.
 */
export async function hasMinRole(
  supabase: SupabaseClient,
  tenantId: string,
  minRole: TenantRoleDb
): Promise<boolean> {
  const role = await getRoleInTenant(supabase, tenantId);
  return role != null && roleAtLeast(role, minRole);
}
