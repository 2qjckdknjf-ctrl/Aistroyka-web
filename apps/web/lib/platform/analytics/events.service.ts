/**
 * Append-only event stream. Key events: report_submit, media_finalize, job_success, job_fail, ai_usage, task_assign, login, export.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type ClientProfile = "web" | "ios_full" | "ios_lite" | "android_full" | "android_lite";

export interface EmitEventParams {
  tenant_id?: string | null;
  user_id?: string | null;
  trace_id?: string | null;
  client_profile?: ClientProfile | null;
  event: string;
  props?: Record<string, unknown>;
}

/** Emit one event. Use service_role for insert (RLS blocks anon). */
export async function emitEvent(
  supabase: SupabaseClient,
  params: EmitEventParams
): Promise<boolean> {
  const { error } = await supabase.from("events").insert({
    tenant_id: params.tenant_id ?? null,
    user_id: params.user_id ?? null,
    trace_id: params.trace_id ?? null,
    client_profile: params.client_profile ?? null,
    event: params.event,
    props: params.props ?? {},
  });
  return !error;
}
