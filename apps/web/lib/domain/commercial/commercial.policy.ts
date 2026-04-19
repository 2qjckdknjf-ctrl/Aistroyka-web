import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canManageChangeOrders, canReadChangeOrders } from "@/lib/domain/change-orders/change-orders.policy";

/** Commercial lines follow the same project boundary as change orders / portal. */
export async function canManageCommercialItems(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<boolean> {
  return canManageChangeOrders(supabase, ctx, projectId);
}

export async function canReadCommercialItems(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<boolean> {
  return canReadChangeOrders(supabase, ctx, projectId);
}
