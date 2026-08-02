/**
 * Shared helpers for tenant-admin RSC pages: resolve active-tenant-scoped reads.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActiveTenantRequestLike } from "@/lib/tenant/active-tenant";
import { requireAdmin } from "@/src/features/admin/auth/requireAdmin";

export type AdminPageTenantScope = {
  allowed: boolean;
  tenantId: string | null;
};

/**
 * Resolve the active tenant for an admin RSC page.
 * Callers must not query tenant-scoped tables when `allowed` is false or `tenantId` is null.
 * Layout already redirects non-admins; this is defense-in-depth for data scoping.
 */
export async function resolveAdminPageTenantScope(
  supabase: SupabaseClient,
  requestLike: ActiveTenantRequestLike
): Promise<AdminPageTenantScope> {
  const result = await requireAdmin(supabase, requestLike);
  return {
    allowed: result.allowed,
    tenantId: result.allowed ? result.tenantId : null,
  };
}
