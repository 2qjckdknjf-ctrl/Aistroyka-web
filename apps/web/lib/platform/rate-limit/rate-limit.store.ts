import type { SupabaseClient } from "@supabase/supabase-js";

/** Build key for rate limit: tenant or IP + endpoint. */
export function rateLimitKey(kind: "tenant" | "ip", id: string, endpoint: string): string {
  const safe = endpoint.replace(/[^a-z0-9_-]/gi, "_");
  return `${kind}:${id}:${safe}`;
}

/** Get current minute window (truncate to minute). */
function currentWindow(): string {
  const d = new Date();
  d.setUTCSeconds(0, 0);
  return d.toISOString();
}

/**
 * Increment counter and return whether under limit. Uses rate_limit_slots table.
 * Call with service-role client so RLS allows. Slightly racy under concurrency; acceptable for Phase 1.
 */
export async function checkAndIncrement(
  supabase: SupabaseClient,
  key: string,
  limit: number
): Promise<{ allowed: boolean; current: number }> {
  const windowStart = currentWindow();
  const { data: existing } = await supabase
    .from("rate_limit_slots")
    .select("count")
    .eq("key", key)
    .eq("window_start", windowStart)
    .maybeSingle();

  const newCount = (existing?.count ?? 0) + 1;
  if (existing) {
    await supabase.from("rate_limit_slots").update({ count: newCount }).eq("key", key).eq("window_start", windowStart);
  } else {
    await supabase.from("rate_limit_slots").insert({ key, window_start: windowStart, count: 1 });
  }
  return { allowed: newCount <= limit, current: newCount };
}
