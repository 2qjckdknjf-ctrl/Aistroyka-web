import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canReadProjects, canManageProjects } from "@/lib/tenant/tenant.policy";
import { getById as getProjectById } from "@/lib/domain/projects/project.repository";
import { notifyProjectManagers, notifyUser } from "@/lib/domain/notifications/manager-notifications.repository";
import { getById as getTaskById } from "@/lib/domain/tasks/task.repository";
import * as repo from "./issue.repository";
import type { ProjectIssue, CreateIssueInput, IssueStatus, UpdateIssueInput } from "./issue.types";

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
  return { data: await withEvidenceUrls(supabase, data), error: "" };
}

async function insertIssue(
  supabase: SupabaseClient,
  ctx: TenantContext,
  input: CreateIssueInput
): Promise<{ data: ProjectIssue | null; error: string }> {
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
    return { data: await withEvidenceUrl(supabase, data), error: "" };
  }
  return { data: null, error: "Create failed" };
}

export async function createIssue(
  supabase: SupabaseClient,
  ctx: TenantContext,
  input: CreateIssueInput
): Promise<{ data: ProjectIssue | null; error: string }> {
  if (!canManageProjects(ctx)) return { data: null, error: "Insufficient rights" };
  return insertIssue(supabase, ctx, input);
}

/** Field worker report: any project reader can file an issue for the manager queue. */
export async function createWorkerReportedIssue(
  supabase: SupabaseClient,
  ctx: TenantContext,
  input: CreateIssueInput
): Promise<{ data: ProjectIssue | null; error: string }> {
  if (!canReadProjects(ctx)) return { data: null, error: "Insufficient rights" };
  return insertIssue(supabase, ctx, input);
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
    const title = `Issue ${statusLabel.toLowerCase()}`;
    const body = data.title.slice(0, 60) + (data.title.length > 60 ? "…" : "");
    await notifyProjectManagers(supabase, ctx.tenantId, data.project_id, {
      type: "issue_status_changed",
      title,
      body,
      target_type: "issue",
      target_id: data.id,
      project_id: data.project_id,
    });
    await notifyIssueWorkers(supabase, ctx.tenantId, ctx.userId, data, title, body);
  }
  return data
    ? { data: await withEvidenceUrl(supabase, data), error: "" }
    : { data: null, error: "Update failed" };
}

const WORKER_ISSUE_STATUSES: IssueStatus[] = ["open", "in_review"];

/** Worker may comment and send for review; resolve/close stays manager-only. */
export async function updateWorkerReportedIssue(
  supabase: SupabaseClient,
  ctx: TenantContext,
  issueId: string,
  input: UpdateIssueInput
): Promise<{ data: ProjectIssue | null; error: string }> {
  if (!canReadProjects(ctx)) return { data: null, error: "Insufficient rights" };
  if (!ctx.tenantId) return { data: null, error: "Tenant required" };
  if (input.status && !WORKER_ISSUE_STATUSES.includes(input.status)) {
    return { data: null, error: "Insufficient rights" };
  }

  const existing = await repo.getById(supabase, issueId, ctx.tenantId);
  if (!existing) return { data: null, error: "Not found" };

  const data = await repo.update(supabase, issueId, ctx.tenantId, input);
  if (data && input.status === "in_review") {
    await notifyProjectManagers(supabase, ctx.tenantId, data.project_id, {
      type: "issue_status_changed",
      title: "Issue in review",
      body: data.title.slice(0, 60) + (data.title.length > 60 ? "…" : ""),
      target_type: "issue",
      target_id: data.id,
      project_id: data.project_id,
    });
  }
  return data
    ? { data: await withEvidenceUrl(supabase, data), error: "" }
    : { data: null, error: "Update failed" };
}

export async function getIssueById(
  supabase: SupabaseClient,
  ctx: TenantContext,
  issueId: string
): Promise<{ data: ProjectIssue | null; error: string }> {
  if (!canReadProjects(ctx)) return { data: null, error: "Insufficient rights" };
  if (!ctx.tenantId) return { data: null, error: "Tenant required" };

  const data = await repo.getById(supabase, issueId, ctx.tenantId);
  return { data: await withEvidenceUrl(supabase, data), error: "" };
}

async function notifyIssueWorkers(
  supabase: SupabaseClient,
  tenantId: string,
  actorUserId: string | null | undefined,
  issue: ProjectIssue,
  title: string,
  body: string
): Promise<void> {
  const recipients = new Set<string>();
  if (issue.created_by && issue.created_by !== actorUserId) {
    recipients.add(issue.created_by);
  }
  if (issue.task_id) {
    const task = await getTaskById(supabase, issue.task_id, tenantId);
    if (task?.assigned_to && task.assigned_to !== actorUserId) {
      recipients.add(task.assigned_to);
    }
  }
  for (const userId of recipients) {
    await notifyUser(supabase, tenantId, userId, {
      type: "issue_status_changed",
      title,
      body,
      target_type: "issue",
      target_id: issue.id,
      project_id: issue.project_id,
    });
  }
}

async function withEvidenceUrls(
  supabase: SupabaseClient,
  issues: ProjectIssue[]
): Promise<ProjectIssue[]> {
  return repo.attachEvidenceUrls(supabase, issues);
}

async function withEvidenceUrl(
  supabase: SupabaseClient,
  issue: ProjectIssue | null
): Promise<ProjectIssue | null> {
  if (!issue) return null;
  const [withUrl] = await repo.attachEvidenceUrls(supabase, [issue]);
  return withUrl ?? issue;
}
