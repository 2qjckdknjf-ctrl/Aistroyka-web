/**
 * Marks expired upload_sessions (created/uploaded, expires_at < now) as expired.
 * No storage delete. Run periodically via cron-enqueued job.
 * Emits upload_session_expired telemetry per session.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { logStructured } from "@/lib/observability";
import type { Job } from "../job.types";

const BATCH_SIZE = 100;

export async function handleUploadReconcile(admin: SupabaseClient, job: Job): Promise<void> {
  const payload = job.payload as { max_age_minutes?: number };
  const cutoff = payload?.max_age_minutes != null
    ? new Date(Date.now() - payload.max_age_minutes * 60 * 1000).toISOString()
    : new Date().toISOString();

  const { data: rows } = await admin
    .from("upload_sessions")
    .select("id, tenant_id, user_id, created_at, expires_at")
    .in("status", ["created", "uploaded"])
    .lt("expires_at", cutoff)
    .limit(BATCH_SIZE);
  if (!rows || rows.length === 0) return;

  const now = Date.now();
  for (const r of rows as { id: string; tenant_id: string; user_id: string; created_at: string; expires_at: string }[]) {
    const expiredAt = new Date(r.expires_at).getTime();
    const ageHours = Math.round((now - expiredAt) / (60 * 60 * 1000));
    logStructured({
      event: "upload_session_expired",
      session_id: r.id,
      tenant_id: r.tenant_id,
      user_id: r.user_id,
      age_hours: ageHours,
    });
  }

  const ids = (rows as { id: string }[]).map((r) => r.id);
  await admin
    .from("upload_sessions")
    .update({ status: "expired" })
    .in("id", ids);
}
