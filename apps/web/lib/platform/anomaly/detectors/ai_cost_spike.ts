import type { SupabaseClient } from "@supabase/supabase-js";
import { getBaseline } from "../baselines.repository";
import type { AnomalyResult } from "../anomaly.types";

const THRESHOLD_MULTIPLIER = 3;

/** Detect AI cost spike vs baseline. Returns anomaly if observed > expected * threshold. */
export async function detectAiCostSpike(
  supabase: SupabaseClient,
  tenantId: string,
  date: Date,
  observedCostUsd: number
): Promise<AnomalyResult | null> {
  const expected = await getBaseline(supabase, tenantId, "ai_cost_usd", date);
  if (expected == null || expected <= 0) return null;
  if (observedCostUsd <= expected * THRESHOLD_MULTIPLIER) return null;
  return {
    severity: observedCostUsd > expected * 5 ? "critical" : "high",
    type: "ai_cost_spike",
    metric: "ai_cost_usd",
    observed: observedCostUsd,
    expected,
    details: { multiplier: observedCostUsd / expected },
  };
}
