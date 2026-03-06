import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getById as getReportById } from "@/lib/domain/reports/report.repository";
import * as jobRepo from "@/lib/platform/jobs/job.repository";

export const dynamic = "force-dynamic";

export type AnalysisStatus = "queued" | "running" | "success" | "failed";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reportId } = await params;
  const ctx = await getTenantContextFromRequest(_request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: e.message.includes("membership") ? 403 : 401 });
    }
    throw e;
  }

  const supabase = await createClient();
  const report = await getReportById(supabase, reportId, ctx.tenantId!);
  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

  const admin = (await import("@/lib/supabase/admin")).getAdminClient();
  const client = admin ?? supabase;
  const list = await jobRepo.listJobsByReportId(client, reportId, ctx.tenantId);
  if (list.length === 0) {
    return NextResponse.json({
      status: "queued" as AnalysisStatus,
      reportId,
      jobCount: 0,
      summary: null,
    });
  }
  const byStatus: Record<string, number> = {};
  for (const j of list) {
    byStatus[j.status] = (byStatus[j.status] ?? 0) + 1;
  }

  let status: AnalysisStatus = "queued";
  if (byStatus.running) status = "running";
  else if (byStatus.queued) status = "queued";
  else if (byStatus.dead || byStatus.failed) status = "failed";
  else if (byStatus.success) status = "success";

  const mediaTotal = list.filter((j) => j.type === "ai_analyze_media").length;
  const successCount = byStatus.success ?? 0;

  return NextResponse.json({
    status,
    reportId,
    jobCount: list.length,
    summary:
      status === "success" || status === "failed"
        ? { mediaTotal, analyzed: successCount, failed: (byStatus.failed ?? 0) + (byStatus.dead ?? 0) }
        : null,
  });
}
