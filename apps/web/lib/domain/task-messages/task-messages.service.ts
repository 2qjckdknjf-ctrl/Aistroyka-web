import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { validateTaskForReportLink } from "@/lib/domain/reports/report.service";
import { canManageTasks } from "@/lib/domain/tasks/task.policy";
import * as taskRepo from "@/lib/domain/tasks/task.repository";
import { getAdminClient } from "@/lib/supabase/admin";
import { enqueuePushToUser } from "@/lib/platform/push/push.service";
import {
  notifyProjectManagers,
  notifyTenantManagers,
} from "@/lib/domain/notifications/manager-notifications.repository";
import { isLiteWorkerClient } from "@/lib/tenant/client-profile";
import { canAccessTaskChat, canSoftDeleteTaskMessage } from "./task-messages.policy";
import * as repo from "./task-messages.repository";
import {
  durationWithinLimit,
  isChatUploadPurpose,
  mimeMatchesKind,
  sizeWithinLimit,
} from "./task-messages.media";
import type { CreateTaskMessageInput, ListTaskMessagesResult, TaskMessage } from "./task-messages.types";

/** Manager/web surfaces only — lite worker clients always use assignment checks. */
function isManagerTaskChatSurface(ctx: TenantContext): boolean {
  return !isLiteWorkerClient(ctx) && canManageTasks(ctx);
}

async function assertTaskChatAccess(
  supabase: SupabaseClient,
  ctx: TenantContext,
  taskId: string
): Promise<{ ok: true; projectId: string } | { ok: false; error: string; status: number; code?: string }> {
  if (!canAccessTaskChat(ctx)) return { ok: false, error: "Insufficient rights", status: 403 };
  if (!ctx.tenantId || !ctx.userId) return { ok: false, error: "Tenant required", status: 401 };

  const task = await taskRepo.getById(supabase, taskId, ctx.tenantId);
  if (!task?.project_id) return { ok: false, error: "Not found", status: 404 };

  // Mirror GET /tasks/:id — lite field workers never get tenant-wide manager chat access.
  if (isManagerTaskChatSurface(ctx)) {
    return { ok: true, projectId: task.project_id };
  }

  const v = await validateTaskForReportLink(supabase, ctx.tenantId, taskId, ctx.userId);
  if (!v.ok) {
    return {
      ok: false,
      error: v.code === "task_not_assigned" ? "Task not assigned" : "Not found",
      status: v.code === "task_not_assigned" ? 403 : 404,
      code: v.code,
    };
  }
  return { ok: true, projectId: task.project_id };
}

export async function listTaskMessages(
  supabase: SupabaseClient,
  ctx: TenantContext,
  taskId: string,
  opts: { limit?: number; cursor?: string | null; tail?: boolean } = {}
): Promise<{ result: ListTaskMessagesResult | null; error: string; status: number; code?: string }> {
  const access = await assertTaskChatAccess(supabase, ctx, taskId);
  if (!access.ok) return { result: null, error: access.error, status: access.status, code: access.code };

  const { data, nextCursor } = await repo.listByTask(supabase, ctx.tenantId!, taskId, {
    limit: opts.limit ?? 50,
    cursor: opts.cursor,
    tail: opts.tail,
  });
  return { result: { data, nextCursor }, error: "", status: 200 };
}

export async function createTaskMessage(
  supabase: SupabaseClient,
  ctx: TenantContext,
  taskId: string,
  input: CreateTaskMessageInput
): Promise<{ data: TaskMessage | null; error: string; status: number; code?: string }> {
  const access = await assertTaskChatAccess(supabase, ctx, taskId);
  if (!access.ok) return { data: null, error: access.error, status: access.status, code: access.code };

  const kind = input.kind;
  if (!kind || !["text", "voice", "image", "video"].includes(kind)) {
    return { data: null, error: "Invalid kind", status: 400 };
  }

  const clientId = input.clientId?.trim() || null;
  if (clientId) {
    const existing = await repo.getByClientId(supabase, ctx.tenantId!, taskId, ctx.userId!, clientId);
    if (existing) return { data: existing, error: "", status: 200 };
  }

  let body: string | null = null;
  let uploadSessionId: string | null = null;
  let durationMs: number | null = null;

  if (kind === "text") {
    body = (input.body ?? "").trim();
    if (!body) return { data: null, error: "body required for text messages", status: 400 };
  } else {
    const mediaId = (input.mediaId ?? "").trim();
    if (!mediaId) return { data: null, error: "mediaId required for media messages", status: 400 };
    const session = await repo.getFinalizedUploadSession(supabase, ctx.tenantId!, mediaId, ctx.userId!);
    if (!session) {
      return { data: null, error: "Finalized upload session not found", status: 400, code: "media_invalid" };
    }
    if (!isChatUploadPurpose(session.purpose)) {
      return { data: null, error: "Upload purpose not allowed for chat", status: 400, code: "media_purpose" };
    }
    if (!mimeMatchesKind(kind, session.mime_type)) {
      return { data: null, error: "MIME type does not match message kind", status: 400, code: "media_mime" };
    }
    if (!sizeWithinLimit(kind, session.size_bytes)) {
      return { data: null, error: "Media exceeds size limit", status: 400, code: "media_size" };
    }
    if (kind === "voice") {
      durationMs = input.durationMs ?? null;
      if (!durationWithinLimit(durationMs)) {
        return { data: null, error: "Voice duration exceeds limit", status: 400, code: "media_duration" };
      }
    }
    uploadSessionId = session.id;
    const caption = (input.body ?? "").trim();
    body = caption.length > 0 ? caption : null;
  }

  const created = await repo.insert(supabase, {
    tenant_id: ctx.tenantId!,
    project_id: access.projectId,
    task_id: taskId,
    sender_user_id: ctx.userId!,
    kind,
    body,
    upload_session_id: uploadSessionId,
    duration_ms: durationMs,
    client_id: clientId,
  });

  if (!created) return { data: null, error: "Create failed", status: 500 };

  void notifyTaskMessageRecipients(supabase, ctx, {
    taskId,
    projectId: access.projectId,
    message: created,
  });

  return { data: created, error: "", status: 201 };
}

export async function softDeleteTaskMessage(
  supabase: SupabaseClient,
  ctx: TenantContext,
  taskId: string,
  messageId: string
): Promise<{ ok: boolean; error: string; status: number }> {
  const access = await assertTaskChatAccess(supabase, ctx, taskId);
  if (!access.ok) return { ok: false, error: access.error, status: access.status };

  // Prefer admin read so already-soft-deleted rows (hidden by RLS SELECT) stay idempotent.
  const admin = getAdminClient() ?? supabase;
  const message = await repo.getById(admin, ctx.tenantId!, messageId);
  if (!message || message.task_id !== taskId) return { ok: false, error: "Not found", status: 404 };
  if (message.deleted_at) return { ok: true, error: "", status: 200 };
  if (!canSoftDeleteTaskMessage(ctx, message.sender_user_id)) {
    return { ok: false, error: "Insufficient rights", status: 403 };
  }

  const ok = await repo.softDelete(admin, ctx.tenantId!, messageId);
  return ok ? { ok: true, error: "", status: 200 } : { ok: false, error: "Delete failed", status: 500 };
}

async function notifyTaskMessageRecipients(
  supabase: SupabaseClient,
  ctx: TenantContext,
  params: { taskId: string; projectId: string; message: TaskMessage }
): Promise<void> {
  try {
    const admin = getAdminClient() ?? supabase;
    const task = await taskRepo.getById(supabase, params.taskId, ctx.tenantId!);
    if (!task) return;

    const recipientIds = new Set<string>();
    if (task.assigned_to && task.assigned_to !== ctx.userId) {
      recipientIds.add(task.assigned_to);
    }

    const { data: assignmentRows } = await supabase
      .from("task_assignments")
      .select("user_id")
      .eq("tenant_id", ctx.tenantId!)
      .eq("task_id", params.taskId);
    for (const row of (assignmentRows ?? []) as { user_id: string }[]) {
      if (row.user_id !== ctx.userId) recipientIds.add(row.user_id);
    }

    const preview =
      params.message.kind === "text"
        ? (params.message.body ?? "New message").slice(0, 120)
        : params.message.kind === "voice"
          ? "Voice message"
          : params.message.kind === "image"
            ? "Photo"
            : "Video";

    // Worker / lite surfaces notify managers; manager surfaces notify assignees (already in set).
    if (!isManagerTaskChatSurface(ctx)) {
      if (params.projectId) {
        await notifyProjectManagers(admin, ctx.tenantId!, params.projectId, {
          type: "task_message",
          title: "New task message",
          body: preview,
          target_type: "task",
          target_id: params.taskId,
          project_id: params.projectId,
        });
      } else {
        await notifyTenantManagers(admin, ctx.tenantId!, {
          type: "task_message",
          title: "New task message",
          body: preview,
          target_type: "task",
          target_id: params.taskId,
          project_id: params.projectId,
        });
      }
    }

    for (const userId of recipientIds) {
      await enqueuePushToUser(admin, {
        tenantId: ctx.tenantId!,
        userId,
        type: "task_message",
        payload: {
          title: "Task message",
          body: preview,
          data: {
            type: "task_message",
            task_id: params.taskId,
            project_id: params.projectId,
            message_id: params.message.id,
            kind: params.message.kind,
          },
          task_id: params.taskId,
          project_id: params.projectId,
          message_id: params.message.id,
          kind: params.message.kind,
        },
      });
    }
  } catch {
    // best-effort notifications
  }
}
