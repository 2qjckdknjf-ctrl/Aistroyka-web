import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canManageClientRequests } from "@/lib/domain/client-requests/client-requests.policy";
import { canReadClientPortalView } from "@/lib/domain/stakeholders/stakeholders.policy";

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
  return canReadClientPortalView(supabase, ctx, projectId);
}
