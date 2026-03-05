import type { SupabaseClient } from "@supabase/supabase-js";
import type { AnomalyResult } from "../anomaly.types";

const FAILURE_THRESHOLD = 20;

/** Detect login bruteforce: high failure count in window. Pass in failure count (e.g. from rate_limit or audit). */
export async function detectLoginBruteforce(
  _supabase: SupabaseClient,
  _tenantId: string,
  failureCount: number
): Promise<AnomalyResult | null> {
  if (failureCount < FAILURE_THRESHOLD) return null;
  return {
    severity: failureCount > 50 ? "critical" : "high",
    type: "login_bruteforce",
    metric: "login_failures",
    observed: failureCount,
    expected: FAILURE_THRESHOLD,
    details: {},
  };
}
