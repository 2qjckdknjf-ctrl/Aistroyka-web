/**
 * Tenant-admin UI access: owner/admin in the *active* tenant only.
 * Being admin in another membership must not unlock `/admin/**` while a
 * non-admin workspace is selected. Platform-owner grants are not substitutes.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isActiveTenantResolutionBlocked,
  type ActiveTenantRequestLike,
} from "@/lib/tenant/active-tenant";
import { resolveTenantForCurrentUser } from "@/lib/api/engine";
import { hasMinRole } from "@/lib/tenant/tenant-membership.server";

const ADMIN_ROLES = ["owner", "admin"] as const;

export interface RequireAdminResult {
  allowed: boolean;
  /** Active tenant id when resolution succeeded; null when denied/blocked/absent. */
  tenantId: string | null;
  /** Tenant IDs where the user is owner or admin (diagnostic / observability). */
  adminTenantIds: string[];
  /** True when explicit active-tenant claim or lookup failed closed. */
  blocked: boolean;
}

const DENIED: RequireAdminResult = {
  allowed: false,
  tenantId: null,
  adminTenantIds: [],
  blocked: false,
};

async function listAdminTenantIds(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  const { data: memberships, error } = await supabase
    .from("tenant_members")
    .select("tenant_id, role")
    .eq("user_id", userId);

  if (error || !memberships?.length) return [];

  return memberships
    .filter((m) => ADMIN_ROLES.includes((m.role as string) as (typeof ADMIN_ROLES)[number]))
    .map((m) => m.tenant_id as string);
}

/**
 * Returns whether the current user is owner/admin for the resolved active tenant.
 * Pass Request/Headers (e.g. `await headers()`) so cookie/header selection applies.
 * Fail-closed on unauthorized/duplicate/invalid/query-error active-tenant claims.
 */
export async function requireAdmin(
  supabase: SupabaseClient,
  requestLike: ActiveTenantRequestLike
): Promise<RequireAdminResult> {
  let user: { id: string } | null = null;
  try {
    const res = await supabase.auth.getUser();
    user = res?.data?.user ?? null;
  } catch {
    return DENIED;
  }
  if (!user) return DENIED;

  let adminTenantIds: string[] = [];
  try {
    adminTenantIds = await listAdminTenantIds(supabase, user.id);
  } catch {
    return { ...DENIED, blocked: true };
  }

  const active = await resolveTenantForCurrentUser(supabase, requestLike);
  if (isActiveTenantResolutionBlocked(active)) {
    return {
      allowed: false,
      tenantId: null,
      adminTenantIds,
      blocked: true,
    };
  }

  const tenantId = active.tenantId;
  if (!tenantId) {
    return {
      allowed: false,
      tenantId: null,
      adminTenantIds,
      blocked: false,
    };
  }

  let allowed = false;
  try {
    allowed = await hasMinRole(supabase, tenantId, "admin");
  } catch {
    return {
      allowed: false,
      tenantId,
      adminTenantIds,
      blocked: true,
    };
  }

  return {
    allowed,
    tenantId,
    adminTenantIds,
    blocked: false,
  };
}
