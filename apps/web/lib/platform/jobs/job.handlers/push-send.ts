/**
 * Handler for push_send job: drain push_outbox (queued rows), attempt send via provider, update status.
 * Retry with backoff on retryable errors; mark device_tokens disabled on invalid_token.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Job } from "../job.types";
import { attemptSend } from "@/lib/platform/push/push.provider.router";

const DRAIN_LIMIT = 20;
const BACKOFF_MS = [60_000, 5 * 60_000, 15 * 60_000, 60 * 60_000]; // 1m, 5m, 15m, 1h

function nextRetryAt(attempts: number): Date {
  const idx = Math.min(Math.max(0, attempts - 1), BACKOFF_MS.length - 1);
  return new Date(Date.now() + BACKOFF_MS[idx]);
}

export async function handlePushSend(admin: SupabaseClient, _job: Job): Promise<void> {
  const { data: rows } = await admin
    .from("push_outbox")
    .select("id, tenant_id, user_id, platform, device_id, type, payload, attempts")
    .eq("status", "queued")
    .or("next_retry_at.is.null,next_retry_at.lte." + new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(DRAIN_LIMIT);
  if (!rows || rows.length === 0) return;

  for (const row of rows as Array<{
    id: string;
    tenant_id: string;
    user_id: string;
    platform: string;
    device_id: string | null;
    type: string;
    payload: Record<string, unknown> | null;
    attempts: number;
  }>) {
    let q = admin
      .from("device_tokens")
      .select("device_id, token")
      .eq("tenant_id", row.tenant_id)
      .eq("user_id", row.user_id)
      .eq("platform", row.platform)
      .is("disabled_at", null);
    if (row.device_id) q = q.eq("device_id", row.device_id);
    const { data: tokens } = await q;
    const tokenList = (tokens ?? []) as Array<{ device_id: string; token: string }>;

    if (tokenList.length === 0) {
      await admin
        .from("push_outbox")
        .update({ status: "failed", last_error: "no_tokens" })
        .eq("id", row.id);
      continue;
    }

    const payload = row.payload ?? {};
    const title = typeof payload.title === "string" ? payload.title : undefined;
    const body = typeof payload.body === "string" ? payload.body : undefined;
    const data = payload.data && typeof payload.data === "object" ? (payload.data as Record<string, string>) : undefined;

    let anySent = false;
    let retryableError: string | null = null;
    const invalidTokenIds: string[] = [];

    for (const t of tokenList) {
      const result = await attemptSend({
        platform: row.platform as "ios" | "android",
        token: t.token,
        title,
        body,
        data,
      });
      if (result.ok) {
        anySent = true;
      } else if (result.code === "invalid_token") {
        invalidTokenIds.push(t.device_id);
      } else if (result.code === "retryable" && !retryableError) {
        retryableError = result.message ?? "retryable";
      }
    }

    if (invalidTokenIds.length > 0) {
      await admin
        .from("device_tokens")
        .update({ disabled_at: new Date().toISOString() })
        .eq("tenant_id", row.tenant_id)
        .eq("user_id", row.user_id)
        .eq("platform", row.platform)
        .in("device_id", invalidTokenIds);
    }

    if (anySent) {
      await admin.from("push_outbox").update({ status: "sent" }).eq("id", row.id);
    } else if (retryableError) {
      const attempts = row.attempts + 1;
      await admin
        .from("push_outbox")
        .update({
          attempts,
          last_error: retryableError,
          next_retry_at: nextRetryAt(attempts).toISOString(),
        })
        .eq("id", row.id);
    } else {
      await admin
        .from("push_outbox")
        .update({ status: "failed", last_error: "send_failed" })
        .eq("id", row.id);
    }
  }
}
