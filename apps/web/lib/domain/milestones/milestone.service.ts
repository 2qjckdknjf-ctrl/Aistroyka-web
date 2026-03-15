import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canReadProjects, canManageProjects } from "@/lib/tenant/tenant.policy";
import { getById as getProjectById } from "@/lib/domain/projects/project.repository";
import * as repo from "./milestone.repository";
import type { Milestone, CreateMilestoneInput, UpdateMilestoneInput } from "./milestone.types";

export async function listMilestones(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<{ data: Milestone[]; error: string }> {
  if (!canReadProjects(ctx)) return { data: [], error: "Insufficient rights" };
  if (!ctx.tenantId) return { data: [], error: "Tenant required" };

  const project = await getProjectById(supabase, projectId, ctx.tenantId);
  if (!project) return { data: [], error: "Project not found" };

  const data = await repo.listByProject(supabase, projectId, ctx.tenantId);
  return { data, error: "" };
}

export async function createMilestone(
  supabase: SupabaseClient,
  ctx: TenantContext,
  input: CreateMilestoneInput
): Promise<{ data: Milestone | null; error: string }> {
  if (!canManageProjects(ctx)) return { data: null, error: "Insufficient rights" };
  if (!ctx.tenantId) return { data: null, error: "Tenant required" };

  const project = await getProjectById(supabase, input.project_id, ctx.tenantId);
  if (!project) return { data: null, error: "Project not found" };

  const trimmed = input.title?.trim();
  if (!trimmed) return { data: null, error: "title required" };
  if (!input.target_date) return { data: null, error: "target_date required" };

  const data = await repo.create(supabase, ctx.tenantId, {
    ...input,
    title: trimmed,
  });
  return data ? { data, error: "" } : { data: null, error: "Create failed" };
}

export async function updateMilestone(
  supabase: SupabaseClient,
  ctx: TenantContext,
  milestoneId: string,
  input: UpdateMilestoneInput
): Promise<{ data: Milestone | null; error: string }> {
  if (!canManageProjects(ctx)) return { data: null, error: "Insufficient rights" };
  if (!ctx.tenantId) return { data: null, error: "Tenant required" };

  const existing = await repo.getById(supabase, milestoneId, ctx.tenantId);
  if (!existing) return { data: null, error: "Not found" };

  const data = await repo.update(supabase, milestoneId, ctx.tenantId, input);
  return data ? { data, error: "" } : { data: null, error: "Update failed" };
}

export async function getMilestoneById(
  supabase: SupabaseClient,
  ctx: TenantContext,
  milestoneId: string
): Promise<{ data: Milestone | null; error: string }> {
  if (!canReadProjects(ctx)) return { data: null, error: "Insufficient rights" };
  if (!ctx.tenantId) return { data: null, error: "Tenant required" };

  const data = await repo.getById(supabase, milestoneId, ctx.tenantId);
  return { data, error: "" };
}
