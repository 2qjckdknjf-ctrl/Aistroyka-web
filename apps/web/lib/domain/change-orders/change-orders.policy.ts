import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canReadProjects } from "@/lib/tenant/tenant.policy";
import { canManageClientRequests } from "@/lib/domain/client-requests/client-requests.policy";
import { canReadClientPortalView } from "@/lib/domain/stakeholders/stakeholders.policy";

/**
 * Manager cohort for commercial change orders: tenant owner/admin or
 * project manager/owner on the target project (same as client requests).
 */
export async function canManageChangeOrders(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<boolean> {
  return canManageClientRequests(supabase, ctx, projectId);
}

export async function canReadChangeOrders(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<boolean> {
  if (!ctx.tenantId || !ctx.userId) return false;
  if (canReadProjects(ctx)) return true;
  return canReadClientPortalView(supabase, ctx, projectId);
}
