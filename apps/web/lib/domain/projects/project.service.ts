import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
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

export async function createProject(
  supabase: SupabaseClient,
  ctx: TenantContext,
  name: string
): Promise<{ id: string } | { error: string }> {
  if (!canManageProjects(ctx)) return { error: "Insufficient rights: only member and above can create projects" };
  const trimmed = name.trim();
  if (!trimmed) return { error: "name is required" };
  if (trimmed.length > 200) return { error: "Project name must be at most 200 characters" };
  const project = await repo.create(supabase, ctx.tenantId, trimmed);
  if (!project) return { error: "Failed to create project" };
  return { id: project.id };
}

const PROCESSING_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Check if project has active AI analysis jobs.
 */
export async function hasActiveJobs(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<{ hasActiveJobs: boolean; error: string | null }> {
  if (!canReadProjects(ctx)) {
    return { hasActiveJobs: false, error: "Insufficient rights" };
  }

  if (!ctx.tenantId) {
    return { hasActiveJobs: false, error: "Tenant required" };
  }

  // Import job repository dynamically to avoid circular dependency
  const { listJobsByProject } = await import("@/lib/platform/jobs/job.repository");
  const jobs = await listJobsByProject(supabase, ctx.tenantId, projectId);

  const now = Date.now();
  const activeJobs = jobs.filter((j) => {
    if (j.status !== "queued" && j.status !== "running") return false;
    // Check timeout for running jobs
    if (j.status === "running" && j.started_at) {
      const started = new Date(j.started_at).getTime();
      if (now - started > PROCESSING_TIMEOUT_MS) return false;
    }
    // Filter by project_id in payload
    const payload = j.payload as { project_id?: string } | undefined;
    return payload?.project_id === projectId;
  });

  return { hasActiveJobs: activeJobs.length > 0, error: null };
}
