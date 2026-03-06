import type { SupabaseClient } from "@supabase/supabase-js";
import type { PushMessageType } from "./push.types";
import { enqueueJob } from "@/lib/platform/jobs/job.service";

/** Enqueue a push message to outbox. Job processor will send via APNs/FCM (or stub). */
export async function enqueuePush(
  supabase: SupabaseClient,
  params: { tenantId: string; userId: string; platform: string; type: PushMessageType; payload?: Record<string, unknown> }
): Promise<string | null> {
  const { data, error } = await supabase
    .from("push_outbox")
    .insert({
      tenant_id: params.tenantId,
      user_id: params.userId,
      platform: params.platform,
      type: params.type,
      payload: params.payload ?? {},
      status: "queued",
    })
    .select("id")
    .single();
  if (error || !data) return null;
  await enqueueJob(supabase, {
    tenant_id: params.tenantId,
    user_id: null,
    type: "push_send",
    payload: {},
    trace_id: null,
    dedupe_key: "push_drain",
  });
  return (data as { id: string }).id;
}

/**
 * Enqueue push to each registered device for a user (one outbox row per device).
 * Dedupe for task_assigned/task_updated: skip device if queued row already exists for same (task_id, user_id, device_id, type).
 * Uses admin client. Does not log tokens.
 */
export async function enqueuePushToUser(
  admin: SupabaseClient,
  params: { tenantId: string; userId: string; type: PushMessageType; payload?: Record<string, unknown> }
): Promise<number> {
  const { data: devices } = await admin
    .from("device_tokens")
    .select("platform, device_id")
    .eq("tenant_id", params.tenantId)
    .eq("user_id", params.userId)
    .is("disabled_at", null);
  const deviceList = (devices ?? []) as { platform: string; device_id: string }[];
  if (deviceList.length === 0) return 0;
  const payload = params.payload ?? {};
  const taskId = typeof payload.task_id === "string" ? payload.task_id : null;
  const isTaskType = params.type === "task_assigned" || params.type === "task_updated";

  let count = 0;
  for (const d of deviceList) {
    if (isTaskType && taskId) {
      const { data: existing } = await admin
        .from("push_outbox")
        .select("id, payload")
        .eq("tenant_id", params.tenantId)
        .eq("user_id", params.userId)
        .eq("device_id", d.device_id)
        .eq("type", params.type)
        .eq("status", "queued")
        .limit(10);
      const withSameTask = (existing ?? []).filter(
        (r: { payload?: Record<string, unknown> }) => r.payload?.task_id === taskId
      );
      if (withSameTask.length > 0) continue;
    }
    const { error } = await admin.from("push_outbox").insert({
      tenant_id: params.tenantId,
      user_id: params.userId,
      platform: d.platform,
      device_id: d.device_id,
      type: params.type,
      payload,
      status: "queued",
    });
    if (!error) count++;
  }
  if (count > 0) {
    await enqueueJob(admin, {
      tenant_id: params.tenantId,
      user_id: null,
      type: "push_send",
      payload: {},
      trace_id: null,
      dedupe_key: "push_drain",
    });
  }
  return count;
}
