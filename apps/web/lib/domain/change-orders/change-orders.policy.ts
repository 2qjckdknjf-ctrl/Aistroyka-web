import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canManageProjects, canReadProjects } from "@/lib/tenant/tenant.policy";
import { canReadClientPortalView } from "@/lib/domain/stakeholders/stakeholders.policy";

export async function canManageChangeOrders(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<boolean> {
  void supabase;
  void projectId;
  return !!ctx.tenantId && !!ctx.userId && canManageProjects(ctx);
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
