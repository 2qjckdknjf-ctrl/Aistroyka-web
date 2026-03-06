/**
 * POST /api/v1/admin/jobs/cron-tick
 * Single cron tick: (1) enqueue upload_reconcile per tenant, (2) run job processing.
 * No tenant context; processes jobs from all tenants. Requires cron secret when REQUIRE_CRON_SECRET=true.
 */

import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { enqueueJob, processJobs } from "@/lib/platform/jobs/job.service";
import { JOB_CONFIG } from "@/lib/platform/jobs/job.config";
import { requireCronSecretIfEnabled } from "@/lib/api/cron-auth";

export const dynamic = "force-dynamic";

const UPLOAD_RECONCILE_PREFIX = "upload_reconcile";
const OPS_EVENTS_PRUNE_PREFIX = "ops_events_prune";

export async function POST(request: Request) {
  const cronErr = requireCronSecretIfEnabled(request);
  if (cronErr) return cronErr;

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Admin client not configured" }, { status: 503 });
  }

  const { data: tenants } = await admin.from("tenants").select("id");
  const tenantList = (tenants ?? []) as { id: string }[];
  let scheduled = 0;
  for (const t of tenantList) {
    const reconcileJob = await enqueueJob(admin, {
      tenant_id: t.id,
      user_id: null,
      type: "upload_reconcile",
      payload: {},
      trace_id: null,
      dedupe_key: `${UPLOAD_RECONCILE_PREFIX}:${t.id}`,
      max_attempts: 2,
    });
    if (reconcileJob) scheduled++;
    const pruneJob = await enqueueJob(admin, {
      tenant_id: t.id,
      user_id: null,
      type: "ops_events_prune",
      payload: {},
      trace_id: null,
      dedupe_key: `${OPS_EVENTS_PRUNE_PREFIX}:${t.id}`,
      max_attempts: 2,
    });
    if (pruneJob) scheduled++;
  }

  const workerId = `cron-tick-${Date.now()}`;
  const summary = await processJobs(admin, workerId, {
    limit: JOB_CONFIG.MAX_CLAIM_LIMIT,
    tenantId: undefined,
    timeBudgetMs: JOB_CONFIG.WORKER_TIME_BUDGET_MS,
  });

  return NextResponse.json({
    ok: true,
    scheduled,
    processed: summary.processed,
    tenants: tenantList.length,
  });
}
