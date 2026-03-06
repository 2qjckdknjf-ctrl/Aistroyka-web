/**
 * POST /api/v1/admin/jobs/schedule-reconcile
 * Enqueues one upload_reconcile job per tenant. Call from cron before jobs/process.
 * Requires cron secret when REQUIRE_CRON_SECRET=true.
 */

import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { enqueueJob } from "@/lib/platform/jobs/job.service";
import { requireCronSecretIfEnabled } from "@/lib/api/cron-auth";

export const dynamic = "force-dynamic";

const DEDUPE_PREFIX = "upload_reconcile";

export async function POST(request: Request) {
  const cronErr = requireCronSecretIfEnabled(request);
  if (cronErr) return cronErr;

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Admin client not configured" }, { status: 503 });
  }

  const { data: tenants } = await admin.from("tenants").select("id");
  if (!tenants?.length) {
    return NextResponse.json({ ok: true, enqueued: 0, tenants: 0 });
  }

  let enqueued = 0;
  for (const t of tenants as { id: string }[]) {
    const job = await enqueueJob(admin, {
      tenant_id: t.id,
      user_id: null,
      type: "upload_reconcile",
      payload: {},
      trace_id: null,
      dedupe_key: `${DEDUPE_PREFIX}:${t.id}`,
      max_attempts: 2,
    });
    if (job) enqueued++;
  }

  return NextResponse.json({ ok: true, enqueued, tenants: tenants.length });
}
