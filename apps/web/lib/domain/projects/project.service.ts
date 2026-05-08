import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { getLimitsForTenant } from "@/lib/platform/subscription/subscription.service";
import { canReadProjects, canManageProjects } from "./project.policy";
import * as repo from "./project.repository";
import type { Project } from "./project.types";

export async function listProjects(
  supabase: SupabaseClient,
  ctx: TenantContext
): Promise<{ data: Project[]; error: string | null }> {
  if (!canReadProjects(ctx)) return { data: [], error: "Insufficient rights" };
  const data = await repo.listByTenant(supabase, ctx.tenantId);
  return { data, error: null };
}

export async function getProject(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<{ data: Project | null; error: string | null }> {
  if (!canReadProjects(ctx)) return { data: null, error: "Insufficient rights" };
  const data = await repo.getById(supabase, projectId, ctx.tenantId);
  return { data, error: null };
}

/**
 * Internal workspace project resolver.
 * Explicit alias used by multiple manager/internal routes and tests.
 */
export async function getProjectForInternalWorkspace(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<{ data: Project | null; error: string | null }> {
  return getProject(supabase, ctx, projectId);
}

export async function createProject(
  supabase: SupabaseClient,
  ctx: TenantContext,
  name: string
): Promise<{ id: string } | { error: string }> {
  if (!canManageProjects(ctx)) return { error: "Insufficient rights: only member and above can create projects" };
  const trimmed = name.trim();
  if (!trimmed) return { error: "name is required" };
  if (trimmed.length > 200) return { error: "Project name must be at most 200 characters" };
  const limits = await getLimitsForTenant(supabase, ctx.tenantId);
  const projectCount = await repo.countByTenant(supabase, ctx.tenantId);
  if (projectCount >= limits.max_projects) {
    return {
      error: "Insufficient quota: project limit reached for your plan. Upgrade your subscription or contact sales.",
    };
  }
  const project = await repo.create(supabase, ctx.tenantId, trimmed);
  if (!project) return { error: "Failed to create project" };
  return { id: project.id };
}
