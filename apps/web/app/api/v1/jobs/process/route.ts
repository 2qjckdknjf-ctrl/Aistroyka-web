import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, authorize } from "@/lib/tenant";
import { getAdminClient } from "@/lib/supabase/admin";
import { processJobs } from "@/lib/platform/jobs/job.service";
import { JOB_CONFIG } from "@/lib/platform/jobs/job.config";
import { checkRateLimit } from "@/lib/platform/rate-limit/rate-limit.service";

export const dynamic = "force-dynamic";

const JOBS_PROCESS_ENDPOINT = "/api/v1/jobs/process";
const CRON_SECRET_HEADER = "x-cron-secret";
export const CRON_UNAUTHORIZED_CODE = "cron_unauthorized";

function requireCronSecretIfEnabled(request: Request): NextResponse | null {
  if (process.env.REQUIRE_CRON_SECRET !== "true") return null;
  const expected = process.env.CRON_SECRET?.trim();
  const provided = request.headers.get(CRON_SECRET_HEADER)?.trim();
  if (!expected || provided !== expected) {
    return NextResponse.json(
      { error: "Unauthorized", code: CRON_UNAUTHORIZED_CODE },
      { status: 403 }
    );
  }
  return null;
}

export async function POST(request: Request) {
  const cronErr = requireCronSecretIfEnabled(request);
  if (cronErr) return cronErr;
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: e.message.includes("membership") ? 403 : 401 });
    }
    throw e;
  }
  if (!authorize(ctx, "jobs:process")) {
    return NextResponse.json({ error: "Insufficient rights: owner or admin required" }, { status: 403 });
  }

  const admin = getAdminClient();
  if (admin) {
    try {
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
      const result = await checkRateLimit(admin, {
        tenantId: ctx.tenantId,
        ip,
        endpoint: JOBS_PROCESS_ENDPOINT,
      });
      if (result.limited) {
        return NextResponse.json({ error: result.message }, { status: 429 });
      }
    } catch {
      /* allow on rate-limit check failure */
    }
  }
  if (!admin) {
    return NextResponse.json({ error: "Job processing not configured" }, { status: 503 });
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

  return NextResponse.json({
    ok: true,
    processed: summary.processed,
    success: summary.success,
    failed: summary.failed,
    dead: summary.dead,
  });
}
