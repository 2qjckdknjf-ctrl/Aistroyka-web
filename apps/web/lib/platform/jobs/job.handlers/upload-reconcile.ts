/**
 * Marks expired upload_sessions (created/uploaded, expires_at < now) as expired.
 * No storage delete. Run periodically via cron-enqueued job.
 * Emits upload_session_expired telemetry per session.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { logStructured } from "@/lib/observability";
import type { Job } from "../job.types";
import { JobPayloadError, JobHandlerError } from "../job.errors";

const BATCH_SIZE = 100;

export async function handleUploadReconcile(admin: SupabaseClient, job: Job): Promise<void> {
  const payload = job.payload as { max_age_minutes?: number };
  if (!job.tenant_id || (payload?.max_age_minutes != null &&
      (typeof payload.max_age_minutes !== "number" || !Number.isFinite(payload.max_age_minutes) || payload.max_age_minutes < 0))) {
    throw new JobPayloadError("Invalid upload reconciliation scope or age");
  }
  const cutoffDate = new Date(Date.now() - (payload?.max_age_minutes ?? 0) * 60 * 1000);
  if (!Number.isFinite(cutoffDate.getTime())) throw new JobPayloadError("Invalid upload reconciliation age");
  const cutoff = cutoffDate.toISOString();
  const { data: rows, error: readError } = await admin
    .from("upload_sessions").select("id, tenant_id")
    .eq("tenant_id", job.tenant_id).in("status", ["created", "uploaded"])
    .is("archived_at", null).lt("expires_at", cutoff).limit(BATCH_SIZE);
  if (readError) throw new JobHandlerError("Upload reconciliation lookup unavailable", true, "RECONCILE_READ_FAILED");
  const ids = (rows ?? []).filter((r) => r.tenant_id === job.tenant_id).map((r) => r.id);
  if (!ids.length) return;
  // Recheck current state: a session finalized after selection must survive.
  const { data: updated, error: updateError } = await admin.from("upload_sessions")
    .update({ status: "expired" }).eq("tenant_id", job.tenant_id)
    .in("id", ids).in("status", ["created", "uploaded"])
    .is("archived_at", null).lt("expires_at", cutoff)
    .select("id, tenant_id, user_id, expires_at");
  if (updateError) throw new JobHandlerError("Upload reconciliation write unavailable", true, "RECONCILE_WRITE_FAILED");
  for (const row of updated ?? []) {
    if (row.tenant_id !== job.tenant_id) continue;
    logStructured({ event: "upload_session_expired", session_id: row.id,
      tenant_id: job.tenant_id, user_id: row.user_id,
      age_hours: Math.round((Date.now() - new Date(row.expires_at).getTime()) / (60 * 60 * 1000)) });
  }
}
