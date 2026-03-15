import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getTaskById, updateTask } from "@/lib/domain/tasks/task.service";
import { getAdminClient } from "@/lib/supabase/admin";
import { enqueuePushToUser } from "@/lib/platform/push/push.service";
import {
  getCachedResponse,
  storeResponse,
  IDEMPOTENCY_HEADER,
} from "@/lib/platform/idempotency/idempotency.service";
import type { UpdateTaskInput } from "@/lib/domain/tasks/task.types";

export const dynamic = "force-dynamic";

const PATCH_ROUTE_KEY = "PATCH /api/v1/tasks/:id";

/** GET /api/v1/tasks/:id — task detail with linked report (manager). */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }

  const supabase = await createClientFromRequest(request);
  const { data, error } = await getTaskById(supabase, ctx, id);
  if (error) return NextResponse.json({ error }, { status: error === "Insufficient rights" ? 403 : 404 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data });
}

/** PATCH /api/v1/tasks/:id — partial update (manager). Idempotent when x-idempotency-key sent. */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

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
  const routeKey = PATCH_ROUTE_KEY.replace(":id", id);
  if (idempotencyKey && ctx.tenantId && ctx.userId) {
    const admin = getAdminClient();
    if (admin) {
      const cached = await getCachedResponse(admin, idempotencyKey, ctx.tenantId, ctx.userId, routeKey);
      if (cached) return NextResponse.json(cached.response as object, { status: cached.statusCode });
    }
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const input: UpdateTaskInput = {};
  if (typeof body.title === "string") input.title = body.title.trim();
  if (body.description !== undefined) input.description = typeof body.description === "string" ? body.description : null;
  if (body.due_at !== undefined) input.due_at = typeof body.due_at === "string" ? body.due_at : null;
  if (typeof body.status === "string") input.status = body.status.trim();
  if (body.required_photos && typeof body.required_photos === "object" && !Array.isArray(body.required_photos))
    input.required_photos = body.required_photos as UpdateTaskInput["required_photos"];
  if (typeof body.report_required === "boolean") input.report_required = body.report_required;
  if (body.milestone_id !== undefined) input.milestone_id = typeof body.milestone_id === "string" ? body.milestone_id : null;

  const supabase = await createClientFromRequest(request);
  const { data, error } = await updateTask(supabase, ctx, id, input);
  if (error) return NextResponse.json({ error }, { status: error === "Insufficient rights" ? 403 : 404 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const admin = getAdminClient();
  if (admin && ctx.tenantId && data.assigned_to) {
    await enqueuePushToUser(admin, {
      tenantId: ctx.tenantId,
      userId: data.assigned_to,
      type: "task_updated",
      payload: { task_id: id, status: data.status },
    });
  }

  const res = NextResponse.json({ data });
  if (idempotencyKey && ctx.tenantId && ctx.userId) {
    const adminClient = getAdminClient();
    if (adminClient) await storeResponse(adminClient, idempotencyKey, ctx.tenantId, ctx.userId, routeKey, { data }, 200);
  }
  return res;
}
