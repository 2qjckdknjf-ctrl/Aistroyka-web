import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { startAssignedTask } from "@/lib/domain/tasks/task.service";
import { requireLiteIdempotency, storeLiteIdempotency } from "@/lib/api/lite-idempotency";

export const dynamic = "force-dynamic";

const PATCH_KEY = "PATCH /api/v1/worker/tasks/:taskId";

/** PATCH /api/v1/worker/tasks/:taskId — assigned worker starts work (`in_progress`). */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await context.params;
  if (!taskId) return NextResponse.json({ error: "Missing task id" }, { status: 400 });

  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: e.message.includes("membership") ? 403 : 401 });
    }
    throw e;
  }
  const guard = await requireLiteIdempotency(request, ctx, PATCH_KEY);
  if (!guard.ok) return guard.response;

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (body.status !== "in_progress") {
    return NextResponse.json({ error: "status must be in_progress" }, { status: 400 });
  }

  const supabase = await createClientFromRequest(request);
  const { data, error, code } = await startAssignedTask(supabase, ctx, taskId);
  if (error) {
    const status = code === "task_closed" ? 400 : error === "Insufficient rights" || error === "Task not assigned" ? 403 : 404;
    return NextResponse.json({ error, code }, { status });
  }
  if (!data) return NextResponse.json({ error: "Update failed" }, { status: 500 });
  await storeLiteIdempotency(request, ctx, PATCH_KEY, { data }, 200);
  return NextResponse.json({ data });
}
