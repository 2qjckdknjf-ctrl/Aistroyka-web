/**
 * Resolve active tenant role for a user (same rules as getTenantContextFromRequest).
 * Used by middleware and dashboard layout for portal-only gating.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { pickPrimaryTenantMembership } from "./tenant-membership-priority";
import type { TenantRoleDb } from "./tenant.types";

/**
 * Returns tenant role for the user's primary tenant. Throws when either lookup fails so callers can fail closed.
 * Owned tenant (`tenants.user_id`) wins; otherwise the strongest membership
 * (internal roles beat stakeholder so dual-role users keep cabinet access).
 */
export async function getActiveTenantRoleForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<TenantRoleDb | null> {
  const { data: ownTenant, error: ownError } = await supabase
    .from("tenants")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (ownError) throw new Error(`tenant owner lookup failed: ${ownError.message}`);
  if (ownTenant?.id) return "owner";
  const { data: members, error: membersError } = await supabase
    .from("tenant_members")
    .select("tenant_id, role")
    .eq("user_id", userId);
  if (membersError) throw new Error(`tenant membership lookup failed: ${membersError.message}`);
  return pickPrimaryTenantMembership(members ?? [])?.role ?? null;
}
