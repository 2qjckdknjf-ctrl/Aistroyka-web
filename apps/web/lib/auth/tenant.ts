/**
 * Tenant membership and roles.
 * Roles: owner > admin > member > viewer.
 * - owner: full access, can delete cabinet, transfer ownership
 * - admin: invite/revoke members, all project actions
 * - member: create projects, upload, run analysis, see analytics
 * - viewer: read-only (projects, analytics)
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type TenantRole = "owner" | "admin" | "member" | "viewer";

const ROLE_ORDER: Record<TenantRole, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
};

export function roleAtLeast(role: TenantRole, minRequired: TenantRole): boolean {
  return ROLE_ORDER[role] >= ROLE_ORDER[minRequired];
}

/**
 * Returns the current user's role in the tenant, or null if no access.
 * Returns null on any error (e.g. missing tenant_members table) so the app does not crash.
 */
export async function getRoleInTenant(
  supabase: SupabaseClient,
  tenantId: string
): Promise<TenantRole | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
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

    if (member?.role && isTenantRole(member.role)) return member.role as TenantRole;
    return null;
  } catch {
    return null;
  }
}

function isTenantRole(s: string): s is TenantRole {
  return ["owner", "admin", "member", "viewer"].includes(s);
}

/**
 * Returns true if the current user has at least the given role in the tenant.
 */
export async function hasMinRole(
  supabase: SupabaseClient,
  tenantId: string,
  minRole: TenantRole
): Promise<boolean> {
  const role = await getRoleInTenant(supabase, tenantId);
  return role != null && roleAtLeast(role, minRole);
}
