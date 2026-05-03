/**
 * Resolve active tenant role for a user (same rules as getTenantContextFromRequest).
 * Used by middleware and dashboard layout for portal-only gating.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantRoleDb } from "./tenant.types";

const MEMBER_DB_ROLES = ["admin", "member", "viewer", "stakeholder"] as const;

function isMemberDbRole(r: string): r is (typeof MEMBER_DB_ROLES)[number] {
  return (MEMBER_DB_ROLES as readonly string[]).includes(r);
}

/**
 * Returns tenant role for the user's primary tenant (tenant owner → owner; else first tenant_members row).
 */
export async function getActiveTenantRoleForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<TenantRoleDb | null> {
  const { data: ownTenant } = await supabase.from("tenants").select("id").eq("user_id", userId).maybeSingle();
  if (ownTenant?.id) return "owner";
  const { data: member } = await supabase
    .from("tenant_members")
    .select("role")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  const r = member?.role;
  if (typeof r === "string" && isMemberDbRole(r)) return r;
  return null;
}
