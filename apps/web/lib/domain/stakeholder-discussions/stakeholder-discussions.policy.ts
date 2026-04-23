import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canManageClientRequests } from "@/lib/domain/client-requests/client-requests.policy";
import {
  canReadClientPortalView,
  canRespondToClientRequests,
} from "@/lib/domain/stakeholders/stakeholders.policy";

export async function canManageStakeholderDiscussions(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<boolean> {
  return canManageClientRequests(supabase, ctx, projectId);
}

export async function canReadStakeholderDiscussions(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<boolean> {
  return canReadClientPortalView(supabase, ctx, projectId);
}

/** Stakeholder may add structured entries when discussion awaits them. */
export async function canParticipateStakeholderDiscussion(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<boolean> {
  return canRespondToClientRequests(supabase, ctx, projectId);
}
