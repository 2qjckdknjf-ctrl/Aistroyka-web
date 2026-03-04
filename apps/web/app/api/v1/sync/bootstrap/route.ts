import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { listTasksForToday } from "@/lib/domain/tasks/task.service";
import { getMaxCursor } from "@/lib/sync/change-log.repository";

export const dynamic = "force-dynamic";

const DEVICE_ID_HEADER = "x-device-id";

/**
 * GET /api/v1/sync/bootstrap
 * Returns initial minimal snapshot (tasks, reports, upload sessions for user) + cursor.
 * Requires x-device-id.
 */
export async function GET(request: Request) {
  const deviceId = request.headers.get(DEVICE_ID_HEADER)?.trim();
  if (!deviceId) {
    return NextResponse.json({ error: "Missing x-device-id header" }, { status: 400 });
  }
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: e.message.includes("membership") ? 403 : 401 });
    }
    throw e;
  }
  const supabase = await createClient();
  const { data: tasks } = await listTasksForToday(supabase, ctx);
  const { data: reports } = await supabase
    .from("worker_reports")
    .select("id, status, created_at, submitted_at")
    .eq("tenant_id", ctx.tenantId)
    .eq("user_id", ctx.userId)
    .order("created_at", { ascending: false })
    .limit(100);
  const { data: sessions } = await supabase
    .from("upload_sessions")
    .select("id, status, created_at, purpose")
    .eq("tenant_id", ctx.tenantId)
    .eq("user_id", ctx.userId)
    .order("created_at", { ascending: false })
    .limit(100);
  const cursor = await getMaxCursor(supabase, ctx.tenantId);
  return NextResponse.json({
    data: {
      tasks: tasks ?? [],
      reports: (reports ?? []) as { id: string; status: string; created_at: string; submitted_at: string | null }[],
      uploadSessions: (sessions ?? []) as { id: string; status: string; created_at: string; purpose: string }[],
    },
    cursor,
    serverTime: new Date().toISOString(),
  });
}
