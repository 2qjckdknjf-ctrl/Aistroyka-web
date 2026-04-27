import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canManageProjects } from "@/lib/tenant/tenant.policy";
import { getMembership } from "@/lib/domain/project-members/project-members.repository";
import {
  canReadClientPortalView,
  canRespondToClientRequests,
} from "@/lib/domain/stakeholders/stakeholders.policy";

/**
 * Same cohort as client portal settings: tenant owner/admin or project manager.
 */
export async function canManageClientRequests(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<boolean> {
  if (!ctx.tenantId || !ctx.userId) return false;
  if (!canManageProjects(ctx)) return false;
  if (ctx.role === "owner" || ctx.role === "admin") return true;
  const m = await getMembership(supabase, ctx.tenantId, projectId, ctx.userId);
  return m?.role === "manager";
}

/**
 * List/read client requests as stakeholder (portal read model).
 * Project owner (legacy) OR active external stakeholder.
 */
export async function canStakeholderAccessClientRequests(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<boolean> {
  return canReadClientPortalView(supabase, ctx, projectId);
}

export { canRespondToClientRequests } from "@/lib/domain/stakeholders/stakeholders.policy";
