import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canReadProjects, canManageProjects } from "@/lib/tenant/tenant.policy";
import { getById as getProjectById } from "@/lib/domain/projects/project.repository";
import { notifyProjectManagers } from "@/lib/domain/notifications/manager-notifications.repository";
import * as repo from "./issue.repository";
import type { ProjectIssue, CreateIssueInput, UpdateIssueInput } from "./issue.types";

export async function listIssues(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  opts?: { status?: string }
): Promise<{ data: ProjectIssue[]; error: string }> {
  if (!canReadProjects(ctx)) return { data: [], error: "Insufficient rights" };
  if (!ctx.tenantId) return { data: [], error: "Tenant required" };

  const project = await getProjectById(supabase, projectId, ctx.tenantId);
  if (!project) return { data: [], error: "Project not found" };

  const data = await repo.listByProject(supabase, projectId, ctx.tenantId, opts);
  return { data, error: "" };
}

export async function createIssue(
  supabase: SupabaseClient,
  ctx: TenantContext,
  input: CreateIssueInput
): Promise<{ data: ProjectIssue | null; error: string }> {
  if (!canManageProjects(ctx)) return { data: null, error: "Insufficient rights" };
  if (!ctx.tenantId) return { data: null, error: "Tenant required" };

  const project = await getProjectById(supabase, input.project_id, ctx.tenantId);
  if (!project) return { data: null, error: "Project not found" };

  const trimmed = input.title?.trim();
  if (!trimmed) return { data: null, error: "title required" };

  const data = await repo.create(supabase, ctx.tenantId, ctx.userId ?? null, {
    ...input,
    title: trimmed,
  });
  if (data) {
    await notifyProjectManagers(supabase, ctx.tenantId, input.project_id, {
      type: "issue_created",
      title: "New issue created",
      body: trimmed.slice(0, 80) + (trimmed.length > 80 ? "…" : ""),
      target_type: "issue",
      target_id: data.id,
      project_id: input.project_id,
    });
    return { data, error: "" };
  }
  return { data: null, error: "Create failed" };
}

export async function updateIssue(
  supabase: SupabaseClient,
  ctx: TenantContext,
  issueId: string,
  input: UpdateIssueInput
): Promise<{ data: ProjectIssue | null; error: string }> {
  if (!canManageProjects(ctx)) return { data: null, error: "Insufficient rights" };
  if (!ctx.tenantId) return { data: null, error: "Tenant required" };

  const existing = await repo.getById(supabase, issueId, ctx.tenantId);
  if (!existing) return { data: null, error: "Not found" };

  const updateInput = { ...input };
  if (input.status && ["resolved", "closed"].includes(input.status)) {
    (updateInput as Record<string, unknown>).resolved_by = ctx.userId ?? null;
  }

  const data = await repo.update(supabase, issueId, ctx.tenantId, updateInput);
  if (data && input.status && ["in_review", "resolved", "closed"].includes(input.status)) {
    const statusLabel =
      input.status === "in_review"
        ? "In review"
        : input.status === "resolved"
          ? "Resolved"
          : "Closed";
    await notifyProjectManagers(supabase, ctx.tenantId, data.project_id, {
      type: "issue_status_changed",
      title: `Issue ${statusLabel.toLowerCase()}`,
      body: data.title.slice(0, 60) + (data.title.length > 60 ? "…" : ""),
      target_type: "issue",
      target_id: data.id,
      project_id: data.project_id,
    });
  }
  return data ? { data, error: "" } : { data: null, error: "Update failed" };
}

export async function getIssueById(
  supabase: SupabaseClient,
  ctx: TenantContext,
  issueId: string
): Promise<{ data: ProjectIssue | null; error: string }> {
  if (!canReadProjects(ctx)) return { data: null, error: "Insufficient rights" };
  if (!ctx.tenantId) return { data: null, error: "Tenant required" };

  const data = await repo.getById(supabase, issueId, ctx.tenantId);
  return { data, error: "" };
}
