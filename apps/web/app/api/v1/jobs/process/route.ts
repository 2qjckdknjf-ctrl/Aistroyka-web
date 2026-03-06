import { NextResponse } from "next/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, authorize } from "@/lib/tenant";
import { getAdminClient } from "@/lib/supabase/admin";
import { processJobs } from "@/lib/platform/jobs/job.service";
import { JOB_CONFIG } from "@/lib/platform/jobs/job.config";
import { checkRateLimit } from "@/lib/platform/rate-limit/rate-limit.service";
import { requireCronSecretIfEnabled } from "@/lib/api/cron-auth";
import { getOrCreateRequestId, logStructured, withRequestIdAndTiming } from "@/lib/observability";

export const dynamic = "force-dynamic";

const ROUTE_KEY = "POST /api/v1/jobs/process";
const RATE_LIMIT_ENDPOINT = "/api/v1/jobs/process";

export async function POST(request: Request) {
  const start = Date.now();
  const cronErr = requireCronSecretIfEnabled(request);
  if (cronErr) return withRequestIdAndTiming(request, cronErr, { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start });
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return withRequestIdAndTiming(request, NextResponse.json({ error: e.message }, { status: e.message.includes("membership") ? 403 : 401 }), { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start });
    }
    throw e;
  }
  if (!authorize(ctx, "jobs:process")) {
    return withRequestIdAndTiming(request, NextResponse.json({ error: "Insufficient rights: owner or admin required" }, { status: 403 }), { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start, tenantId: ctx.tenantId, userId: ctx.userId });
  }

  const admin = getAdminClient();
  if (admin) {
    try {
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
      const result = await checkRateLimit(admin, {
        tenantId: ctx.tenantId,
        ip,
        endpoint: RATE_LIMIT_ENDPOINT,
      });
      if (result.limited) {
        return withRequestIdAndTiming(request, NextResponse.json({ error: result.message }, { status: 429 }), { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start, tenantId: ctx.tenantId, userId: ctx.userId });
      }
    } catch {
      logStructured({ event: "rate_limit_unavailable", endpoint: RATE_LIMIT_ENDPOINT, tenant_id: ctx.tenantId, request_id: getOrCreateRequestId(request) });
    }
  }
  if (!admin) {
    return withRequestIdAndTiming(request, NextResponse.json({ error: "Job processing not configured" }, { status: 503 }), { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start, tenantId: ctx.tenantId, userId: ctx.userId });
  }

  const url = new URL(request.url);
  const limitParam = url.searchParams.get("limit");
  const limit = Math.min(
    Math.max(1, parseInt(limitParam ?? String(JOB_CONFIG.DEFAULT_CLAIM_LIMIT), 10) || JOB_CONFIG.DEFAULT_CLAIM_LIMIT),
    JOB_CONFIG.MAX_CLAIM_LIMIT
  );

  const workerId = `http-${ctx.tenantId}-${Date.now()}`;
  const summary = await processJobs(admin, workerId, {
    limit,
    tenantId: ctx.tenantId,
    timeBudgetMs: JOB_CONFIG.WORKER_TIME_BUDGET_MS,
  });

  return withRequestIdAndTiming(request, NextResponse.json({
    ok: true,
    processed: summary.processed,
    success: summary.success,
    failed: summary.failed,
    dead: summary.dead,
  }), { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start, tenantId: ctx.tenantId, userId: ctx.userId });
}
