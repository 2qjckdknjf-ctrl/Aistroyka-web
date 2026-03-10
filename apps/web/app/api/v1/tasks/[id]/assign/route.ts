import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { assignTask, getTaskById } from "@/lib/domain/tasks/task.service";
import { getAdminClient } from "@/lib/supabase/admin";
import { enqueuePushToUser } from "@/lib/platform/push/push.service";
import { emitAudit } from "@/lib/observability/audit.service";
import { notifyTenantManagers } from "@/lib/domain/notifications/manager-notifications.repository";
import {
  getCachedResponse,
  storeResponse,
  IDEMPOTENCY_HEADER,
} from "@/lib/platform/idempotency/idempotency.service";
import { withRequestIdAndTiming } from "@/lib/observability";

export const dynamic = "force-dynamic";

const ROUTE_KEY_PREFIX = "POST /api/v1/tasks/";
const ROUTE_KEY_SUFFIX = "/assign";

/** POST /api/v1/tasks/:id/assign — assign task to worker (manager). Body: { worker_id }. Idempotent when x-idempotency-key sent. */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const { id: taskId } = await context.params;
  const routeKey = ROUTE_KEY_PREFIX + (taskId ?? "") + ROUTE_KEY_SUFFIX;
  if (!taskId) {
    return withRequestIdAndTiming(request, NextResponse.json({ error: "Missing task id" }, { status: 400 }), {
      route: routeKey,
      method: "POST",
      duration_ms: Date.now() - start,
    });
  }

  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return withRequestIdAndTiming(request, NextResponse.json({ error: e.message }, { status: 401 }), {
        route: routeKey,
        method: "POST",
        duration_ms: Date.now() - start,
      });
    }
    throw e;
  }

  const idempotencyKey = request.headers.get(IDEMPOTENCY_HEADER)?.trim();
  if (idempotencyKey && ctx.tenantId && ctx.userId) {
    const admin = getAdminClient();
    if (admin) {
      const cached = await getCachedResponse(admin, idempotencyKey, ctx.tenantId, ctx.userId, routeKey);
      if (cached) {
        return withRequestIdAndTiming(request, NextResponse.json(cached.response as object, { status: cached.statusCode }), {
          route: routeKey,
          method: "POST",
          duration_ms: Date.now() - start,
          tenantId: ctx.tenantId,
          userId: ctx.userId,
        });
      }
    }
  }

  let body: { worker_id?: string; assignee_id?: string } = {};
  try {
    body = await request.json();
  } catch {
    return withRequestIdAndTiming(request, NextResponse.json({ error: "Invalid JSON" }, { status: 400 }), {
      route: routeKey,
      method: "POST",
      duration_ms: Date.now() - start,
      tenantId: ctx.tenantId,
      userId: ctx.userId,
    });
  }
  const workerId = (body.worker_id ?? body.assignee_id)?.trim();
  if (!workerId) {
    return withRequestIdAndTiming(request, NextResponse.json({ error: "worker_id or assignee_id required" }, { status: 400 }), {
      route: routeKey,
      method: "POST",
      duration_ms: Date.now() - start,
      tenantId: ctx.tenantId,
      userId: ctx.userId,
    });
  }

  const supabase = await createClientFromRequest(request);
  const { error } = await assignTask(supabase, ctx, taskId, workerId);
  if (error) {
    return withRequestIdAndTiming(request, NextResponse.json({ error }, { status: error === "Insufficient rights" ? 403 : 400 }), {
      route: routeKey,
      method: "POST",
      duration_ms: Date.now() - start,
      tenantId: ctx.tenantId,
      userId: ctx.userId,
    });
  }

  if (ctx.tenantId && ctx.userId) {
    await emitAudit(supabase, {
      tenant_id: ctx.tenantId,
      user_id: ctx.userId,
      trace_id: ctx.traceId ?? null,
      action: "task_assignment",
      resource_type: "task",
      resource_id: taskId,
      details: { assigned_to: workerId },
    });
  }

  const { data: task } = ctx.tenantId ? await getTaskById(supabase, ctx, taskId) : { data: null };
  if (ctx.tenantId) {
    await notifyTenantManagers(supabase, ctx.tenantId, {
      type: "task_assigned",
      title: "Task assigned",
      body: task?.title ?? "A task was assigned",
      target_type: "task",
      target_id: taskId,
    });
  }

  const admin = getAdminClient();
  if (admin && ctx.tenantId && task) {
    await enqueuePushToUser(admin, {
      tenantId: ctx.tenantId,
      userId: workerId,
      type: "task_assigned",
      payload: { task_id: taskId, project_id: task.project_id ?? undefined },
    });
  }

  const payload = { ok: true };
  const res = NextResponse.json(payload);
  if (idempotencyKey && ctx.tenantId && ctx.userId) {
    const adminClient = getAdminClient();
    if (adminClient) await storeResponse(adminClient, idempotencyKey, ctx.tenantId, ctx.userId, routeKey, payload, 200);
  }
  return withRequestIdAndTiming(request, res, {
    route: routeKey,
    method: "POST",
    duration_ms: Date.now() - start,
    tenantId: ctx.tenantId,
    userId: ctx.userId,
  });
}
