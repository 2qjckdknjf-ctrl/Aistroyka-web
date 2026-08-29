import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
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

  const supabase = await createClientFromRequest(_request);
  const report = await getReportById(supabase, reportId, ctx.tenantId!);
  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

  const admin = (await import("@/lib/supabase/admin")).getAdminClient();
  const client = admin ?? supabase;
  const list = await jobRepo.listJobsByReportId(client, reportId, ctx.tenantId);
  if (list.length === 0) {
    return NextResponse.json({
      status: "failed" as AnalysisStatus,
      reportId,
      jobCount: 0,
      failureReason: "not_enqueued",
      summary: { mediaTotal: 0, analyzed: 0, failed: 0 },
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

  // Report-level sentinel jobs are orchestration records, not photos.
  // Count only ai_analyze_media rows so progress can never exceed mediaTotal.
  const mediaJobs = list.filter((job) => job.type === "ai_analyze_media");
  const mediaTotal = mediaJobs.length;
  const analyzed = mediaJobs.filter((job) => job.status === "success").length;
  const failed = mediaJobs.filter(
    (job) => job.status === "failed" || job.status === "dead"
  ).length;

  return NextResponse.json({
    status,
    reportId,
    jobCount: list.length,
    summary:
      status === "success" || status === "failed"
        ? { mediaTotal, analyzed, failed }
        : null,
  });
}
