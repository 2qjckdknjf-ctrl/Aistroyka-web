/**
 * Admin access: only tenant_members with role 'owner' or 'admin' may access /admin/*.
 * Uses Supabase server client (user JWT); RLS on tenant_members restricts to own rows.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

const ADMIN_ROLES = ["owner", "admin"] as const;

export interface RequireAdminResult {
  allowed: boolean;
  /** Tenant IDs where the user is owner or admin (for scoping observability). */
  adminTenantIds: string[];
}

/**
 * Returns whether the current user is owner or admin in at least one tenant.
 * Use in server layout/route for /admin to redirect non-admins.
 */
export async function requireAdmin(supabase: SupabaseClient): Promise<RequireAdminResult> {
  const empty = { allowed: false, adminTenantIds: [] as string[] };
  let user: { id: string } | null = null;
  try {
    const res = await supabase.auth.getUser();
    user = res?.data?.user ?? null;
  } catch {
    return empty;
  }
  if (!user) {
    return empty;
  }

  const { data: memberships, error } = await supabase
    .from("tenant_members")
    .select("tenant_id, role")
    .eq("user_id", user.id);

  if (error || !memberships?.length) {
    return { allowed: false, adminTenantIds: [] };
  }

  const adminTenantIds = memberships
    .filter((m) => ADMIN_ROLES.includes((m.role as string) as (typeof ADMIN_ROLES)[number]))
    .map((m) => m.tenant_id as string);

  return {
    allowed: adminTenantIds.length > 0,
    adminTenantIds,
  };
}
