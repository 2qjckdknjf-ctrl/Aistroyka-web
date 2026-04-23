import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canManageClientRequests } from "@/lib/domain/client-requests/client-requests.policy";
import { canReadClientPortalView } from "@/lib/domain/stakeholders/stakeholders.policy";

export async function canManageDefects(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<boolean> {
  return canManageClientRequests(supabase, ctx, projectId);
}

/** Internal managers (no portal) can still operate punch list; stakeholders need portal read. */
export async function canReadDefects(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<boolean> {
  if (await canManageClientRequests(supabase, ctx, projectId)) return true;
  return canReadClientPortalView(supabase, ctx, projectId);
}

/** Portal stakeholder may submit a new open defect (RLS-enforced). */
export async function canReportDefectAsStakeholder(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<boolean> {
  return canReadClientPortalView(supabase, ctx, projectId);
}
