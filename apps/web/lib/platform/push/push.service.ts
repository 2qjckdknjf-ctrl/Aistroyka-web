import type { SupabaseClient } from "@supabase/supabase-js";
import type { PushMessageType } from "./push.types";

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
  return (data as { id: string }).id;
}
