/**
 * Marks expired upload_sessions (created/uploaded, expires_at < now) as expired.
 * No storage delete. Run periodically via cron-enqueued job.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Job } from "../job.types";

const BATCH_SIZE = 100;

export async function handleUploadReconcile(admin: SupabaseClient, job: Job): Promise<void> {
  const payload = job.payload as { max_age_minutes?: number };
  const cutoff = payload?.max_age_minutes != null
    ? new Date(Date.now() - payload.max_age_minutes * 60 * 1000).toISOString()
    : new Date().toISOString();

  const { data: rows } = await admin
    .from("upload_sessions")
    .select("id")
    .in("status", ["created", "uploaded"])
    .lt("expires_at", cutoff)
    .limit(BATCH_SIZE);
  if (!rows || rows.length === 0) return;

  const ids = (rows as { id: string }[]).map((r) => r.id);
  await admin
    .from("upload_sessions")
    .update({ status: "expired" })
    .in("id", ids);
}
