import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canManageProjects } from "@/lib/tenant/tenant.policy";
import { getMembership } from "@/lib/domain/project-members/project-members.repository";
import { getById as getProjectById } from "@/lib/domain/projects/project.repository";
import {
  canReadClientPortalView,
  canRespondToClientRequests,
} from "@/lib/domain/stakeholders/stakeholders.policy";

/**
 * Same cohort as client portal settings: tenant owner/admin or project manager/owner.
 * Always requires the project to belong to the caller's tenant (blocks cross-tenant IDs).
 */
export async function canManageClientRequests(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<boolean> {
  if (!ctx.tenantId || !ctx.userId) return false;
  if (!canManageProjects(ctx)) return false;

  const project = await getProjectById(supabase, projectId, ctx.tenantId);
  if (!project) return false;

  if (ctx.role === "owner" || ctx.role === "admin") return true;
  const m = await getMembership(supabase, ctx.tenantId, projectId, ctx.userId);
  return m?.role === "manager" || m?.role === "owner";
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
