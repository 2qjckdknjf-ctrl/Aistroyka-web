import type { SupabaseClient } from "@supabase/supabase-js";
import { getLimitsForTenant } from "@/lib/platform/subscription/subscription.service";
import { getOrCreateBillingState } from "./ai-usage.repository";
import * as repo from "./ai-usage.repository";
import type { AiUsageRecord } from "./ai-usage.types";
import { estimateCostUsd } from "./cost-estimator";

/** Check if tenant can spend estimated amount this period. Returns null if allowed, 402 message if quota exceeded. */
export async function checkQuota(
  supabase: SupabaseClient,
  tenantId: string,
  estimatedCostUsd: number
): Promise<null | string> {
  const limits = await getLimitsForTenant(supabase, tenantId);
  const state = await getOrCreateBillingState(supabase, tenantId);
  if (!state) return null;
  const budget = limits.monthly_ai_budget_usd;
  if (state.spent_usd + estimatedCostUsd > budget) {
    return "AI quota exceeded for this period. Upgrade or wait for next period.";
  }
  return null;
}

/** Persist usage and increment tenant spent. Call after AI request. */
export async function recordUsage(
  supabase: SupabaseClient,
  record: AiUsageRecord
): Promise<void> {
  await repo.insertUsage(supabase, record);
  if (record.tenant_id && record.cost_usd > 0) {
    await repo.addSpent(supabase, record.tenant_id, record.cost_usd);
  }
}

/** Estimate cost for vision request (no token count until response). Use rough default. */
export function estimateVisionCostUsd(model: string): number {
  return estimateCostUsd(model, 500, 300);
}
