import type { SupabaseClient } from "@supabase/supabase-js";
import { getBaseline } from "../baselines.repository";
import type { AnomalyResult } from "../anomaly.types";

const THRESHOLD_MULTIPLIER = 4;

export async function detectUploadSpike(
  supabase: SupabaseClient,
  tenantId: string,
  date: Date,
  observedUploads: number
): Promise<AnomalyResult | null> {
  const expected = await getBaseline(supabase, tenantId, "uploads_count", date);
  if (expected == null || expected <= 0) return null;
  if (observedUploads <= expected * THRESHOLD_MULTIPLIER) return null;
  return {
    severity: "medium",
    type: "upload_spike",
    metric: "uploads_count",
    observed: observedUploads,
    expected,
    details: {},
  };
}
