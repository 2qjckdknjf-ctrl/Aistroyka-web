import type { SupabaseClient } from "@supabase/supabase-js";
import { getBaseline } from "../baselines.repository";
import type { AnomalyResult } from "../anomaly.types";

const THRESHOLD_MULTIPLIER = 10;

export async function detectSyncAbuse(
  supabase: SupabaseClient,
  tenantId: string,
  date: Date,
  observedSyncCalls: number
): Promise<AnomalyResult | null> {
  const expected = await getBaseline(supabase, tenantId, "sync_calls", date);
  if (expected == null || expected <= 0) return null;
  if (observedSyncCalls <= expected * THRESHOLD_MULTIPLIER) return null;
  return {
    severity: "medium",
    type: "sync_abuse",
    metric: "sync_calls",
    observed: observedSyncCalls,
    expected,
    details: {},
  };
}
