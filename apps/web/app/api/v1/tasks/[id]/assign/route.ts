import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { assignTask, getTaskById } from "@/lib/domain/tasks/task.service";
import { getAdminClient } from "@/lib/supabase/admin";
import { enqueuePushToUser } from "@/lib/platform/push/push.service";
import {
  getCachedResponse,
  storeResponse,
  IDEMPOTENCY_HEADER,
} from "@/lib/platform/idempotency/idempotency.service";

export const dynamic = "force-dynamic";

const ROUTE_KEY_PREFIX = "POST /api/v1/tasks/";
const ROUTE_KEY_SUFFIX = "/assign";

/** POST /api/v1/tasks/:id/assign — assign task to worker (manager). Body: { worker_id }. Idempotent when x-idempotency-key sent. */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: taskId } = await context.params;
  if (!taskId) return NextResponse.json({ error: "Missing task id" }, { status: 400 });

  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }

  const idempotencyKey = request.headers.get(IDEMPOTENCY_HEADER)?.trim();
  const routeKey = ROUTE_KEY_PREFIX + taskId + ROUTE_KEY_SUFFIX;
  if (idempotencyKey && ctx.tenantId && ctx.userId) {
    const admin = getAdminClient();
    if (admin) {
      const cached = await getCachedResponse(admin, idempotencyKey, ctx.tenantId, ctx.userId, routeKey);
      if (cached) return NextResponse.json(cached.response as object, { status: cached.statusCode });
    }
  }

  let body: { worker_id?: string; assignee_id?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const workerId = (body.worker_id ?? body.assignee_id)?.trim();
  if (!workerId) return NextResponse.json({ error: "worker_id or assignee_id required" }, { status: 400 });

  const supabase = await createClientFromRequest(request);
  const { error } = await assignTask(supabase, ctx, taskId, workerId);
  if (error) return NextResponse.json({ error }, { status: error === "Insufficient rights" ? 403 : 400 });

  const admin = getAdminClient();
  if (admin && ctx.tenantId) {
    const { data: task } = await getTaskById(supabase, ctx, taskId);
    if (task) {
      await enqueuePushToUser(admin, {
        tenantId: ctx.tenantId,
        userId: workerId,
        type: "task_assigned",
        payload: { task_id: taskId, project_id: task.project_id ?? undefined },
      });
    }
  }

  const payload = { ok: true };
  const res = NextResponse.json(payload);
  if (idempotencyKey && ctx.tenantId && ctx.userId) {
    const adminClient = getAdminClient();
    if (adminClient) await storeResponse(adminClient, idempotencyKey, ctx.tenantId, ctx.userId, routeKey, payload, 200);
  }
  return res;
}
