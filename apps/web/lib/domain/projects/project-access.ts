/**
 * Project access helpers and guards.
 * project_members is canonical for project-scoped access.
 *
 * - getProjectWithAccess: requires project_members row (membership-based)
 * - requireProjectAccess: project or throws
 * - isProjectOwner / requireProjectOwner: project_members.role=owner
 * - getProjectMembership: project_members only (no tenant fallback)
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canReadProjects } from "@/lib/tenant/tenant.policy";
import { getById as getProjectById } from "./project.repository";
import { getMembership } from "../project-members/project-members.repository";
import type { Project } from "./project.types";
import type { ProjectRole } from "./project-access.types";

export class ProjectAccessError extends Error {
  constructor(
    message: string,
    public readonly code: "forbidden" | "not_found" | "tenant_required"
  ) {
    super(message);
    this.name = "ProjectAccessError";
  }
}

/** Tenant-level owner check (ctx.role). Kept for compatibility. */
export function isOwnerSide(ctx: TenantContext): boolean {
  return ctx.role === "owner";
}

/** Require tenant owner-side. Throws if not. */
export function requireOwnerSide(ctx: TenantContext): void {
  if (!ctx.tenantId || !ctx.userId) {
    throw new ProjectAccessError("Tenant and user required", "tenant_required");
  }
  if (!isOwnerSide(ctx)) {
    throw new ProjectAccessError("Owner-side access required", "forbidden");
  }
}

/**
 * Check if user is project owner (project_members.role=owner).
 */
export async function isProjectOwner(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string,
  userId: string
): Promise<boolean> {
  const m = await getMembership(supabase, tenantId, projectId, userId);
  return m?.role === "owner";
}

/**
 * Require project owner (project_members.role=owner). Throws if not.
 */
export async function requireProjectOwner(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<Project> {
  if (!ctx.tenantId || !ctx.userId) {
    throw new ProjectAccessError("Tenant and user required", "tenant_required");
  }
  const project = await requireProjectAccess(supabase, ctx, projectId);
  const isOwner = await isProjectOwner(supabase, ctx.tenantId, projectId, ctx.userId);
  if (!isOwner) {
    throw new ProjectAccessError("Project owner access required", "forbidden");
  }
  return project;
}

/**
 * Resolve project with membership-based access. User must have project_members row.
 */
export async function getProjectWithAccess(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<{ project: Project; error: null } | { project: null; error: string }> {
  if (!canReadProjects(ctx)) {
    return { project: null, error: "Insufficient rights" };
  }
  if (!ctx.tenantId || !ctx.userId) {
    return { project: null, error: "Tenant required" };
  }

  const membership = await getMembership(supabase, ctx.tenantId, projectId, ctx.userId);
  if (!membership) {
    return { project: null, error: "Project not found" };
  }

  const project = await getProjectById(supabase, projectId, ctx.tenantId);
  if (!project) {
    return { project: null, error: "Project not found" };
  }
  return { project, error: null };
}

/**
 * Require project access. Returns project or throws ProjectAccessError.
 */
export async function requireProjectAccess(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<Project> {
  const result = await getProjectWithAccess(supabase, ctx, projectId);
  if (result.error === "Insufficient rights") {
    throw new ProjectAccessError(result.error, "forbidden");
  }
  if (result.error === "Tenant required") {
    throw new ProjectAccessError(result.error, "tenant_required");
  }
  if (result.project === null) {
    throw new ProjectAccessError("Project not found", "not_found");
  }
  return result.project;
}

/**
 * Require owner-side access. Uses project_members.role=owner.
 */
export async function requireOwnerProjectAccess(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<Project> {
  return requireProjectOwner(supabase, ctx, projectId);
}

/**
 * Get project membership from project_members only.
 */
export async function getProjectMembership(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string,
  userId: string
): Promise<{ role: ProjectRole; source: "project_members" } | null> {
  const m = await getMembership(supabase, tenantId, projectId, userId);
  if (!m) return null;
  const role: ProjectRole =
    m.role === "manager" ? "manager" : m.role === "owner" ? "owner" : "internal_member";
  return { role, source: "project_members" };
}
