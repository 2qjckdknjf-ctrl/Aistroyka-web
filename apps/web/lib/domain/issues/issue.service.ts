import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canReadProjects, canManageProjects } from "@/lib/tenant/tenant.policy";
import { getById as getProjectById } from "@/lib/domain/projects/project.repository";
import { notifyProjectManagers, notifyUser } from "@/lib/domain/notifications/manager-notifications.repository";
import { getById as getTaskById } from "@/lib/domain/tasks/task.repository";
import * as repo from "./issue.repository";
import type { ProjectIssue, CreateIssueInput, IssueStatus, UpdateIssueInput } from "./issue.types";
import { workerMayMutateIssue } from "./worker-issue-access";
import {
  nextWorkerIssueDescription,
  workerIssuePatchError,
  workerIssueUpdatePayload,
} from "./worker-issue-patch";

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
  return { data: await presentIssues(supabase, ctx.tenantId, data), error: "" };
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
    return { data: await presentIssue(supabase, ctx.tenantId, data), error: "" };
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
    ? { data: await presentIssue(supabase, ctx.tenantId, data), error: "" }
    : { data: null, error: "Update failed" };
}

const WORKER_ISSUE_STATUSES: IssueStatus[] = ["open", "in_review"];

/** Worker may comment and send for review if they reported it or are assigned on the linked task. Resolve/close stays manager-only. */
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

  let assignedTo: string | null = null;
  if (existing.task_id) {
    const task = await getTaskById(supabase, existing.task_id, ctx.tenantId);
    assignedTo = task?.assigned_to ?? null;
  }
  if (!workerMayMutateIssue({ userId: ctx.userId, createdBy: existing.created_by, assignedTo })) {
    return { data: null, error: "Insufficient rights" };
  }
  const closed = workerIssuePatchError(existing);
  if (closed) return { data: null, error: closed };

  const description = nextWorkerIssueDescription(existing.description, input.description);
  const safeInput = workerIssueUpdatePayload(input, description);
  const data = await repo.update(supabase, issueId, ctx.tenantId, safeInput);
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
    ? { data: await presentIssue(supabase, ctx.tenantId, data), error: "" }
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
  return { data: await presentIssue(supabase, ctx.tenantId, data), error: "" };
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

async function presentIssues(
  supabase: SupabaseClient,
  tenantId: string | undefined,
  issues: ProjectIssue[]
): Promise<ProjectIssue[]> {
  const withUrls = await repo.attachEvidenceUrls(supabase, issues);
  return withTaskAssignees(supabase, tenantId, withUrls);
}

async function presentIssue(
  supabase: SupabaseClient,
  tenantId: string | undefined,
  issue: ProjectIssue | null
): Promise<ProjectIssue | null> {
  if (!issue) return null;
  const [presented] = await presentIssues(supabase, tenantId, [issue]);
  return presented ?? issue;
}

/** Fill `assigned_to` from the linked task so Worker UI matches PATCH access. */
async function withTaskAssignees(
  supabase: SupabaseClient,
  tenantId: string | undefined,
  issues: ProjectIssue[]
): Promise<ProjectIssue[]> {
  if (!tenantId || issues.length === 0) {
    return issues.map((issue) => ({ ...issue, assigned_to: issue.assigned_to ?? null }));
  }
  const taskIds = [
    ...new Set(issues.map((issue) => issue.task_id).filter((id): id is string => Boolean(id))),
  ];
  if (taskIds.length === 0) {
    return issues.map((issue) => ({ ...issue, assigned_to: null }));
  }
  const assignedByTask = new Map<string, string | null>();
  await Promise.all(
    taskIds.map(async (taskId) => {
      const task = await getTaskById(supabase, taskId, tenantId);
      assignedByTask.set(taskId, task?.assigned_to ?? null);
    })
  );
  return issues.map((issue) => ({
    ...issue,
    assigned_to: issue.task_id ? (assignedByTask.get(issue.task_id) ?? null) : null,
  }));
}
