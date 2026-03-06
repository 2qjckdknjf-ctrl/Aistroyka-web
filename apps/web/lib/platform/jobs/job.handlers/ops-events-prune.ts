/**
 * Prune ops_events older than retention days. Keeps metrics storage bounded.
 * Run periodically via cron-tick enqueue. Logs pruned count.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { logStructured } from "@/lib/observability";
import type { Job } from "../job.types";

const DEFAULT_RETENTION_DAYS = 90;

function getRetentionDays(payload: { retention_days?: number } | undefined): number {
  const fromEnv = process.env.OPS_EVENTS_RETENTION_DAYS;
  if (fromEnv != null && fromEnv !== "") {
    const n = parseInt(fromEnv, 10);
    if (Number.isFinite(n) && n >= 1) return Math.min(n, 365);
  }
  const fromPayload = payload?.retention_days;
  if (typeof fromPayload === "number" && fromPayload >= 1) return Math.min(fromPayload, 365);
  return DEFAULT_RETENTION_DAYS;
}

export async function handleOpsEventsPrune(admin: SupabaseClient, job: Job): Promise<void> {
  const days = getRetentionDays(job.payload as { retention_days?: number });
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffIso = cutoff.toISOString();

  const { data: deleted } = await admin
    .from("ops_events")
    .delete()
    .eq("tenant_id", job.tenant_id)
    .lt("created_at", cutoffIso)
    .select("id");

  const pruned = deleted?.length ?? 0;
  logStructured({
    event: "ops_events_pruned",
    tenant_id: job.tenant_id,
    job_id: job.id,
    retention_days: days,
    pruned_count: pruned,
  });
}
