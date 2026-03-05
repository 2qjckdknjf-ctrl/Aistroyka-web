import type { SupabaseClient } from "@supabase/supabase-js";
import { getBaseline } from "../baselines.repository";
import type { AnomalyResult } from "../anomaly.types";

const FAILURE_RATE_THRESHOLD = 0.5;

export async function detectJobFailureSpike(
  supabase: SupabaseClient,
  tenantId: string,
  date: Date,
  failures: number,
  total: number
): Promise<AnomalyResult | null> {
  if (total < 5) return null;
  const rate = failures / total;
  const expectedRate = await getBaseline(supabase, tenantId, "job_failure_rate", date);
  const expected = expectedRate != null ? expectedRate : 0.1;
  if (rate <= Math.max(expected * 2, FAILURE_RATE_THRESHOLD)) return null;
  return {
    severity: rate > 0.8 ? "critical" : "high",
    type: "job_failure_spike",
    metric: "job_failure_rate",
    observed: rate,
    expected,
    details: { failures, total },
  };
}
