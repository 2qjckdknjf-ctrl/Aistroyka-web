/**
 * GET /api/v1/admin/ops/diagnostics
 * Centralized observability: build correlation + ops metrics + AI runtime summary + job failures by type.
 * Admin only; tenant-scoped. Single view for "what is failing, where, which build."
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { requireAdmin } from "@/lib/api/require-admin";
import { getBuildStamp } from "@/lib/config/public";
import { getOpsMetrics } from "@/lib/ops/ops-metrics.repository";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  listAiRuntimeAuditRows,
  aggregateAiRuntimeRows,
} from "@/lib/observability/audit.service";
import { getFailedJobs } from "@/lib/observability/metrics.service";
import { buildIncidentHints } from "@/lib/ops/incident-hints";

export const dynamic = "force-dynamic";

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
  const adminErr = requireAdmin(ctx, "read");
  if (adminErr) return adminErr;

  const url = new URL(request.url);
  const hours = Math.min(168, Math.max(1, Number(url.searchParams.get("hours")) || 24));
  const limit = Math.min(500, Math.max(50, Number(url.searchParams.get("limit")) || 200));

  const supabase = await createClient();
  const stamp = getBuildStamp();

  const [opsMetrics, aiRows, failedJobs] = await Promise.all([
    getOpsMetrics(supabase, ctx.tenantId!, { from: undefined, to: undefined }, getAdminClient() ?? undefined),
    listAiRuntimeAuditRows(supabase, ctx.tenantId!, { hours, limit }),
    getFailedJobs(supabase, ctx.tenantId!, 100),
  ]);

  const aiAgg = aggregateAiRuntimeRows(aiRows);
  const byRoute: Record<string, number> = {};
  const errorsByProvider: Record<string, number> = {};
  let aiComplete = 0;
  let aiErrors = 0;
  for (const r of aiRows) {
    const act = String(r.action ?? "");
    if (act.includes("_error")) {
      aiErrors += 1;
      const prov = (r.details as Record<string, unknown>)?.provider;
      const key = typeof prov === "string" && prov.length > 0 ? prov : "unknown";
      errorsByProvider[key] = (errorsByProvider[key] ?? 0) + 1;
    } else if (act.includes("_complete")) aiComplete += 1;
    const rt = (r.details as Record<string, unknown>)?.route;
    if (typeof rt === "string" && rt.length > 0) {
      byRoute[rt] = (byRoute[rt] ?? 0) + 1;
    }
  }
  const totalAi = aiComplete + aiErrors;
  const errorRateWindow = totalAi > 0 ? aiErrors / totalAi : null;

  const jobsByType: Record<string, number> = {};
  for (const j of failedJobs) {
    const t = j.type ?? "unknown";
    jobsByType[t] = (jobsByType[t] ?? 0) + 1;
  }

  const dominantJobType =
    Object.keys(jobsByType).length > 0
      ? Object.entries(jobsByType).sort((a, b) => b[1] - a[1])[0][0]
      : null;

  const incidentHints = buildIncidentHints({
    errorRateWindow,
    errorsByProvider,
    failedJobCount: failedJobs.length,
    dominantJobType,
    uploadsStuck: opsMetrics.uploads_stuck,
  });

  return NextResponse.json({
    correlation: {
      build_sha: stamp.sha ? stamp.sha.slice(0, 7) : null,
      build_time: stamp.buildTime || null,
      app_env: process.env.NEXT_PUBLIC_APP_ENV ?? process.env.NODE_ENV ?? null,
    },
    ops_metrics: opsMetrics,
    ai_runtime: {
      window_hours: hours,
      by_action: aiAgg.by_action,
      errors_by_kind: aiAgg.errors_by_kind,
      errors_by_provider: errorsByProvider,
      by_route: byRoute,
      complete_count: aiComplete,
      error_count: aiErrors,
      error_rate_window: errorRateWindow,
      recent_error_sample: aiAgg.recent_error_sample.slice(0, 15),
    },
    job_failures: {
      by_type: jobsByType,
      total: failedJobs.length,
      recent: failedJobs.slice(0, 20).map((j) => ({
        id: j.id,
        type: j.type,
        status: j.status,
        created_at: j.created_at,
        last_error_preview: (j.last_error ?? "").slice(0, 200),
      })),
    },
    incident_hints: incidentHints.length > 0 ? incidentHints : null,
    operator_hints: {
      correlate: "Match trace_id in audit to JSON log request_id.",
      build: "Use correlation.build_sha to identify deployment.",
      classify_503: "Computation or provider — check ai_runtime.recent_error_sample and job_failures.",
      classify_upload: "Check ops_metrics.uploads_stuck and queues in /api/v1/ops/overview.",
      runbooks: "See docs/reliability/STEP17_RUNBOOKS.md and STEP17_INCIDENT_TRIAGE_MODEL.md.",
    },
  });
}
