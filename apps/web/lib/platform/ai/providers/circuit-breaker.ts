/**
 * Circuit breaker: closed (normal), open (fail fast), half_open (probe).
 * Persist state in ai_provider_health; call recordSuccess/recordFailure after each call.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

const THRESHOLD = 5;
const WINDOW_MS = 60_000;

export type CircuitState = "closed" | "open" | "half_open";

export async function getCircuitState(
  supabase: SupabaseClient,
  provider: string
): Promise<CircuitState> {
  const { data, error } = await supabase
    .from("ai_provider_health")
    .select("state, failure_count, last_failure_at, updated_at")
    .eq("provider", provider)
    .maybeSingle();
  if (error || !data) return "closed";
  const row = data as { state: string; failure_count: number; last_failure_at: string | null };
  if (row.state === "open") {
    const at = row.last_failure_at ? new Date(row.last_failure_at).getTime() : 0;
    if (Date.now() - at > WINDOW_MS) return "half_open";
    return "open";
  }
  return (row.state as CircuitState) || "closed";
}

export async function recordSuccess(supabase: SupabaseClient, provider: string): Promise<void> {
  await supabase.from("ai_provider_health").upsert(
    {
      provider,
      state: "closed",
      failure_count: 0,
      last_failure_at: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "provider" }
  );
}

export async function recordFailure(supabase: SupabaseClient, provider: string): Promise<void> {
  const { data } = await supabase
    .from("ai_provider_health")
    .select("failure_count")
    .eq("provider", provider)
    .maybeSingle();
  const count = ((data as { failure_count?: number } | null)?.failure_count ?? 0) + 1;
  const state = count >= THRESHOLD ? "open" : "closed";
  await supabase.from("ai_provider_health").upsert(
    {
      provider,
      state,
      failure_count: count,
      last_failure_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "provider" }
  );
}

export async function canInvoke(supabase: SupabaseClient, provider: string): Promise<boolean> {
  const state = await getCircuitState(supabase, provider);
  return state !== "open";
}
