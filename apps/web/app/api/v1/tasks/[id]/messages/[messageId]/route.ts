import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { softDeleteTaskMessage } from "@/lib/domain/task-messages/task-messages.service";
import { withRequestIdAndTiming } from "@/lib/observability";

export const dynamic = "force-dynamic";

/** DELETE /api/v1/tasks/:id/messages/:messageId — soft-delete chat message. */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; messageId: string }> }
) {
  const start = Date.now();
  const { id: taskId, messageId } = await context.params;
  const routeKey = `DELETE /api/v1/tasks/${taskId ?? ""}/messages/${messageId ?? ""}`;
  if (!taskId || !messageId) {
    return withRequestIdAndTiming(request, NextResponse.json({ error: "Missing ids" }, { status: 400 }), {
      route: routeKey,
      method: "DELETE",
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
        method: "DELETE",
        duration_ms: Date.now() - start,
      });
    }
    throw e;
  }

  const supabase = await createClientFromRequest(request);
  const { ok, error, status } = await softDeleteTaskMessage(supabase, ctx, taskId, messageId);
  if (!ok) {
    return withRequestIdAndTiming(request, NextResponse.json({ error }, { status }), {
      route: routeKey,
      method: "DELETE",
      duration_ms: Date.now() - start,
      tenantId: ctx.tenantId,
      userId: ctx.userId,
    });
  }
  return withRequestIdAndTiming(request, NextResponse.json({ ok: true }), {
    route: routeKey,
    method: "DELETE",
    duration_ms: Date.now() - start,
    tenantId: ctx.tenantId,
    userId: ctx.userId,
  });
}
