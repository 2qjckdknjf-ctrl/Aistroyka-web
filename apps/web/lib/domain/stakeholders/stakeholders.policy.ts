import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canManageProjects } from "@/lib/tenant/tenant.policy";
import { getMembership } from "@/lib/domain/project-members/project-members.repository";
import { isProjectOwner } from "@/lib/domain/projects/project-access";
import * as projectRepo from "@/lib/domain/projects/project.repository";
import * as repo from "./stakeholders.repository";

/**
 * Managers / tenant admins can invite and revoke stakeholders.
 */
export async function canManageProjectStakeholders(
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
 * Read client portal + list client requests (curated read model).
 * Authorized: project owner (legacy) OR active external stakeholder.
 */
export async function canReadClientPortalView(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<boolean> {
  if (!ctx.tenantId || !ctx.userId) return false;
  const project = await projectRepo.getById(supabase, projectId, ctx.tenantId);
  if (!project?.client_portal_enabled) return false;
  if (await isProjectOwner(supabase, ctx.tenantId, projectId, ctx.userId)) return true;
  const sh = await repo.getActiveForUserOnProject(supabase, ctx.tenantId, projectId, ctx.userId);
  return !!sh;
}

/**
 * Respond to client requests (POST respond).
 * Authorized: project owner OR active stakeholder with client_decision_maker.
 */
export async function canRespondToClientRequests(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<boolean> {
  if (!ctx.tenantId || !ctx.userId) return false;
  const project = await projectRepo.getById(supabase, projectId, ctx.tenantId);
  if (!project?.client_portal_enabled) return false;
  if (await isProjectOwner(supabase, ctx.tenantId, projectId, ctx.userId)) return true;
  const sh = await repo.getActiveForUserOnProject(supabase, ctx.tenantId, projectId, ctx.userId);
  return sh?.stakeholder_role === "client_decision_maker";
}
