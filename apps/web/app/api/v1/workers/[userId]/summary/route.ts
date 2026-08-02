import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, LitePathForbiddenError } from "@/lib/tenant";

export const dynamic = "force-dynamic";

/** GET /api/v1/workers/:userId/summary — reports count and media count for worker (tenant-scoped). */
export async function GET(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params;
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof LitePathForbiddenError) {
      return NextResponse.json(
        { error: "forbidden", code: "lite_client_path_forbidden" },
        { status: 403 }
      );
    }
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }

  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const [reportRes, contractorRes, tasksRes, overdueRes, pendingReviewRes] = await Promise.all([
    supabase.from("worker_reports").select("id", { count: "exact" }).eq("tenant_id", ctx.tenantId!).eq("user_id", userId).limit(5000),
    supabase.from("project_members").select("user_id").eq("tenant_id", ctx.tenantId!).eq("user_id", userId).eq("role", "contractor").eq("status", "active").limit(1),
    supabase.from("worker_tasks").select("id", { count: "exact" }).eq("tenant_id", ctx.tenantId!).eq("assigned_to", userId).in("status", ["pending", "in_progress"]),
    supabase.from("worker_tasks").select("id", { count: "exact" }).eq("tenant_id", ctx.tenantId!).eq("assigned_to", userId).lt("due_date", today).in("status", ["pending", "in_progress"]),
    supabase.from("worker_reports").select("id", { count: "exact" }).eq("tenant_id", ctx.tenantId!).eq("user_id", userId).in("status", ["submitted", "changes_requested"]).limit(5000),
  ]);

  const ids = (reportRes.data ?? []).map((r) => (r as { id: string }).id);
  let mediaCount = 0;
  if (ids.length > 0) {
    const { count } = await supabase.from("worker_report_media").select("id", { count: "exact", head: true }).in("report_id", ids);
    mediaCount = count ?? 0;
  }

  const is_contractor = (contractorRes.data ?? []).length > 0;
  const tasks_assigned = tasksRes.count ?? 0;
  const tasks_overdue = overdueRes.count ?? 0;
  const reports_pending_review = pendingReviewRes.count ?? 0;

  return NextResponse.json({
    data: {
      reports_count: reportRes.count ?? 0,
      media_count: mediaCount,
      is_contractor: is_contractor,
      tasks_assigned,
      tasks_overdue,
      reports_pending_review,
    },
  });
}
