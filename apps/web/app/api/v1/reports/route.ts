import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { listReportsForManager } from "@/lib/domain/reports/report-list.repository";

export const dynamic = "force-dynamic";

/** GET /api/v1/reports — list reports (tenant-scoped). Query: project_id, from, to, limit, status. Enriches with media_count and analysis_status. */
export async function GET(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }

  const url = new URL(request.url);
  const projectId = url.searchParams.get("project_id") ?? undefined;
  const userId = url.searchParams.get("worker_id") ?? url.searchParams.get("user_id") ?? undefined;
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  const statusFilter = url.searchParams.get("status") ?? undefined;
  const q = url.searchParams.get("q") ?? undefined;
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 200);

  const supabase = await createClientFromRequest(request);
  let data = await listReportsForManager(supabase, ctx.tenantId!, {
    projectId,
    userId,
    from,
    to,
    limit,
    q,
  });
  if (statusFilter) data = data.filter((r) => r.status === statusFilter);

  const reportIds = data.map((r) => r.id);
  if (reportIds.length === 0) return NextResponse.json({ data: data.map((r) => ({ ...r, media_count: 0, analysis_status: "none" as const })) });

  const [mediaRes, jobsRes] = await Promise.all([
    supabase.from("worker_report_media").select("report_id").in("report_id", reportIds),
    supabase
      .from("jobs")
      .select("status, payload")
      .eq("tenant_id", ctx.tenantId!)
      .or("type.eq.ai_analyze_report,type.eq.ai_analyze_media")
      .limit(1000),
  ]);

  const mediaCountByReport: Record<string, number> = {};
  for (const r of data) mediaCountByReport[r.id] = 0;
  for (const row of (mediaRes.data ?? []) as { report_id: string }[]) {
    if (mediaCountByReport[row.report_id] !== undefined) mediaCountByReport[row.report_id]++;
  }

  const jobs = (jobsRes.data ?? []) as { status: string; payload?: { report_id?: string } }[];
  const statusByReport: Record<string, "queued" | "running" | "success" | "failed"> = {};
  for (const r of data) statusByReport[r.id] = "queued";
  for (const j of jobs) {
    const rid = j.payload?.report_id;
    if (!rid || statusByReport[rid] === undefined) continue;
    if (j.status === "running") statusByReport[rid] = "running";
    else if (j.status === "success" && statusByReport[rid] !== "running") statusByReport[rid] = "success";
    else if ((j.status === "failed" || j.status === "dead") && statusByReport[rid] !== "running" && statusByReport[rid] !== "success")
      statusByReport[rid] = "failed";
  }

  const enriched = data.map((r) => ({
    ...r,
    media_count: mediaCountByReport[r.id] ?? 0,
    analysis_status: statusByReport[r.id] ?? ("none" as const),
  }));
  return NextResponse.json({ data: enriched });
}
