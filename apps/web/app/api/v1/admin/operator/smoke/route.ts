import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, LitePathForbiddenError } from "@/lib/tenant";
import { requireAdmin } from "@/lib/api/require-admin";
import { getMetricsOverview, getFailedJobs } from "@/lib/observability/metrics.service";
import { getSloDaily } from "@/lib/sre/slo.service";
import { getOpsMetrics } from "@/lib/ops/ops-metrics.repository";
import { listAiRuntimeAuditRows } from "@/lib/observability/audit.service";
import { listAnomalies } from "@/lib/platform/anomaly/anomaly.service";
import { getAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type SmokeStatus = "pass" | "warn" | "fail";
type SmokeCheck = {
  key: string;
  status: SmokeStatus;
  details: string;
};

function statusFromCounts(hasData: boolean, hardFailure: boolean): SmokeStatus {
  if (hardFailure) return "fail";
  if (!hasData) return "warn";
  return "pass";
}

export async function POST(request: Request) {
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
  const adminErr = requireAdmin(ctx, "read");
  if (adminErr) return adminErr;

  const supabase = await createClient();

  const [metricsRows, sloRows, opsMetrics, failedJobs, aiAuditRows, anomalies] = await Promise.all([
    getMetricsOverview(supabase, ctx.tenantId, 7),
    getSloDaily(supabase, { tenantId: ctx.tenantId, rangeDays: 7 }),
    getOpsMetrics(supabase, ctx.tenantId, {}, getAdminClient() ?? undefined),
    getFailedJobs(supabase, ctx.tenantId, 30),
    listAiRuntimeAuditRows(supabase, ctx.tenantId, { hours: 24, limit: 150 }),
    listAnomalies(supabase, ctx.tenantId, 30, false),
  ]);

  const requests = sloRows.reduce((sum, row) => sum + (row.requests ?? 0), 0);
  const errors = sloRows.reduce((sum, row) => sum + (row.errors ?? 0), 0);
  const errorRate = requests > 0 ? (errors / requests) * 100 : 0;
  const aiErrors = aiAuditRows.filter((row) => String(row.action).includes("_error")).length;
  const aiCompletions = aiAuditRows.filter((row) => String(row.action).includes("_complete")).length;
  const aiErrorRate = aiErrors + aiCompletions > 0 ? (aiErrors / (aiErrors + aiCompletions)) * 100 : 0;

  const checks: SmokeCheck[] = [
    {
      key: "metrics_ingestion",
      status: statusFromCounts(metricsRows.length > 0, false),
      details:
        metricsRows.length > 0
          ? `tenant_daily_metrics rows: ${metricsRows.length} (7d)`
          : "No recent metrics rows found (possible ingestion lag).",
    },
    {
      key: "slo_window",
      status: requests === 0 ? "warn" : errorRate > 2 ? "warn" : "pass",
      details: requests === 0 ? "No SLO requests in 7d." : `SLO error rate ${errorRate.toFixed(2)}% across ${requests} requests.`,
    },
    {
      key: "jobs_pipeline",
      status: failedJobs.length > 20 ? "fail" : failedJobs.length > 0 ? "warn" : "pass",
      details:
        failedJobs.length > 0
          ? `Failed/dead jobs: ${failedJobs.length} (last 30).`
          : "No failed/dead jobs in recent queue window.",
    },
    {
      key: "ai_runtime",
      status: aiAuditRows.length === 0 ? "warn" : aiErrorRate > 10 ? "warn" : "pass",
      details:
        aiAuditRows.length === 0
          ? "No AI runtime audit rows in the last 24h."
          : `AI error rate ${aiErrorRate.toFixed(2)}% (errors ${aiErrors}, complete ${aiCompletions}).`,
    },
    {
      key: "ops_pressure",
      status:
        opsMetrics.uploads_stuck > 10 || opsMetrics.jobs_failed > 20
          ? "warn"
          : "pass",
      details: `uploads_stuck=${opsMetrics.uploads_stuck}, jobs_failed=${opsMetrics.jobs_failed}, sync_conflicts=${opsMetrics.sync_conflicts}.`,
    },
    {
      key: "anomaly_load",
      status: anomalies.length > 20 ? "warn" : "pass",
      details: `Open anomalies: ${anomalies.length}.`,
    },
  ];

  const hasFail = checks.some((c) => c.status === "fail");
  const hasWarn = checks.some((c) => c.status === "warn");
  const overall: SmokeStatus = hasFail ? "fail" : hasWarn ? "warn" : "pass";

  return NextResponse.json({
    success: true,
    overall,
    checks,
    generated_at: new Date().toISOString(),
  });
}
