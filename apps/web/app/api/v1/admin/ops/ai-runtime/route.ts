/**
 * GET /api/v1/admin/ops/ai-runtime
 * Tenant-scoped AI runtime audit rollup (copilot, intelligence, vision).
 * Admin read only. Correlates with logs via trace_id / request_id.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { requireAdmin } from "@/lib/api/require-admin";
import {
  listAiRuntimeAuditRows,
  aggregateAiRuntimeRows,
} from "@/lib/observability/audit.service";
import { getBuildStamp } from "@/lib/config/public";

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
  const hours = Math.min(168, Math.max(1, Number(url.searchParams.get("hours")) || 72));
  const limit = Math.min(500, Math.max(50, Number(url.searchParams.get("limit")) || 300));

  const supabase = await createClient();
  const rows = await listAiRuntimeAuditRows(supabase, ctx.tenantId!, { hours, limit });
  const aggregates = aggregateAiRuntimeRows(rows);
  const stamp = getBuildStamp();

  const by_route: Record<string, number> = {};
  let completeCount = 0;
  let errorCount = 0;
  for (const r of rows) {
    const act = String(r.action ?? "");
    if (act.includes("_error")) errorCount += 1;
    else if (act.includes("_complete")) completeCount += 1;
    const rt = (r.details as Record<string, unknown>)?.route;
    if (typeof rt === "string" && rt.length > 0) {
      by_route[rt] = (by_route[rt] ?? 0) + 1;
    }
  }
  const totalAi = completeCount + errorCount;
  const error_rate_window = totalAi > 0 ? errorCount / totalAi : null;

  return NextResponse.json({
    data: {
      aggregates,
      recent: rows.slice(0, 80),
      window_hours: hours,
      drilldown: {
        by_route,
        complete_count: completeCount,
        error_count: errorCount,
        error_rate_window,
      },
      operator_hints: {
        classify_401: "Auth/session — not data quality.",
        classify_403: "Tenant or role — permission path.",
        classify_503_intelligence: "Computation failure — check logs + ai_intelligence_error audit.",
        classify_503_vision: "Provider or config — check ai_vision_analyze_error + env.",
        correlate: "Match trace_id in audit to JSON log lines (request_id).",
      },
    },
    correlation: {
      build_sha: stamp.sha ? stamp.sha.slice(0, 7) : null,
      build_time: stamp.buildTime || null,
      app_env: process.env.NEXT_PUBLIC_APP_ENV ?? process.env.NODE_ENV ?? null,
    },
  });
}
