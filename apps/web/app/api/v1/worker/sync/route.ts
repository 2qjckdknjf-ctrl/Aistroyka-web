import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { listTasksForToday } from "@/lib/domain/tasks/task.service";
import { getOrCreateTraceId } from "@/lib/observability";

export const dynamic = "force-dynamic";

/**
 * Lightweight sync for mobile: tasks, report statuses, upload session statuses since timestamp.
 * Returns delta items. Pagination token optional for Phase 2.
 */
export async function GET(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: e.message.includes("membership") ? 403 : 401 });
    }
    throw e;
  }
  const traceId = getOrCreateTraceId(request);
  const serverTime = new Date().toISOString();
  const url = new URL(request.url);
  const since = url.searchParams.get("since"); // ISO timestamp; optional

  const supabase = await createClient();
  const { data: tasks } = await listTasksForToday(supabase, ctx);

  const { data: reports } = await supabase
    .from("worker_reports")
    .select("id, status, created_at, submitted_at")
    .eq("tenant_id", ctx.tenantId)
    .eq("user_id", ctx.userId)
    .order("created_at", { ascending: false })
    .limit(50);
  const reportList = (reports ?? []) as { id: string; status: string; created_at: string; submitted_at: string | null }[];
  const reportsDelta = since
    ? reportList.filter((r) => r.created_at >= since || (r.submitted_at && r.submitted_at >= since))
    : reportList;

  const { data: sessions } = await supabase
    .from("upload_sessions")
    .select("id, status, created_at")
    .eq("tenant_id", ctx.tenantId)
    .eq("user_id", ctx.userId)
    .order("created_at", { ascending: false })
    .limit(50);
  const sessionList = (sessions ?? []) as { id: string; status: string; created_at: string }[];
  const sessionsDelta = since ? sessionList.filter((s) => s.created_at >= since) : sessionList;

  return NextResponse.json({
    serverTime,
    traceId,
    data: {
      tasks: tasks ?? [],
      reports: reportsDelta,
      uploadSessions: sessionsDelta,
    },
    pagination: null,
  });
}
