/**
 * Resolve active tenant role for a user (aligned with getTenantContextFromRequest).
 * Used by middleware and dashboard layout for portal-only gating.
 *
 * When `request` is provided, respects explicit active-tenant header/cookie (2C / T-P2-1).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantRoleDb } from "./tenant.types";
import { resolveActiveTenantId, type ActiveTenantRequestLike } from "./active-tenant";

const MEMBER_DB_ROLES = ["admin", "member", "viewer", "stakeholder"] as const;

function isMemberDbRole(r: string): r is (typeof MEMBER_DB_ROLES)[number] {
  return (MEMBER_DB_ROLES as readonly string[]).includes(r);
}

/**
 * Returns tenant role for the user's active tenant.
 * Optional `requestLike` (Request or Headers) enables validated header/cookie selection.
 */
export async function getActiveTenantRoleForUser(
  supabase: SupabaseClient,
  userId: string,
  requestLike?: ActiveTenantRequestLike | null
): Promise<TenantRoleDb | null> {
  const active = await resolveActiveTenantId(supabase, userId, requestLike ?? null);
  if (!active.tenantId) return null;

  const { data: tenant } = await supabase
    .from("tenants")
    .select("user_id")
    .eq("id", active.tenantId)
    .maybeSingle();
  if (tenant?.user_id === userId) return "owner";

  const { data: member } = await supabase
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", active.tenantId)
    .eq("user_id", userId)
    .maybeSingle();
  const r = member?.role;
  if (typeof r === "string" && isMemberDbRole(r)) return r;
  if (typeof r === "string" && r === "owner") return "owner";
  return null;
}
