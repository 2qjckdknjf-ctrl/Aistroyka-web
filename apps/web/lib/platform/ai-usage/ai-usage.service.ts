import type { SupabaseClient } from "@supabase/supabase-js";
import { getLimitsForTenant } from "@/lib/platform/subscription/subscription.service";
import { getOrCreateBillingState } from "./ai-usage.repository";
import * as repo from "./ai-usage.repository";
import type { AiUsageRecord } from "./ai-usage.types";
import { estimateCostUsd } from "./cost-estimator";
import { createAlert } from "@/lib/sre/alert.service";

const SOFT_BUDGET_PCT = 0.8;

/** Check if tenant can spend estimated amount this period. Returns null if allowed, 402 message if quota/budget exceeded. */
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
    await createAlert(supabase, {
      tenant_id: tenantId,
      severity: "critical",
      type: "ai_budget_exceeded",
      message: `AI monthly budget exceeded (spent ${state.spent_usd.toFixed(2)} USD, budget ${budget} USD).`,
    });
    return "AI budget exceeded for this period. Upgrade or wait for next period.";
  }
  return null;
}

/** Emit soft budget alert when usage >= soft threshold (e.g. 80% of monthly budget). Call after checkQuota when allowed. */
export async function checkBudgetAlert(
  supabase: SupabaseClient,
  tenantId: string,
  estimatedCostUsd: number
): Promise<void> {
  const limits = await getLimitsForTenant(supabase, tenantId);
  const state = await getOrCreateBillingState(supabase, tenantId);
  if (!state) return;
  const budget = limits.monthly_ai_budget_usd;
  if (budget <= 0) return;
  const softThreshold = budget * SOFT_BUDGET_PCT;
  const afterRequest = state.spent_usd + estimatedCostUsd;
  if (state.spent_usd < softThreshold && afterRequest >= softThreshold) {
    await createAlert(supabase, {
      tenant_id: tenantId,
      severity: "warn",
      type: "ai_budget_soft_exceeded",
      message: `AI monthly usage reached ${Math.round(SOFT_BUDGET_PCT * 100)}% of budget (${budget} USD).`,
    });
  }
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

/** Default vision model ids per provider for quota estimation. Align with router/provider defaults. */
const VISION_MODEL_BY_PROVIDER: Record<string, string> = {
  openai: "gpt-4o",
  anthropic: "claude-3-5-sonnet-20241022",
  gemini: "gemini-1.5-flash",
};

const VISION_PROVIDERS = ["openai", "anthropic", "gemini"] as const;

/**
 * Maximum estimated vision cost across the given providers.
 * Use for quota checks so we never under-reserve when the router may pick any configured provider.
 */
export function estimateMaxVisionCostUsd(
  configuredProviders: readonly string[],
  _tier?: string
): number {
  if (configuredProviders.length === 0) {
    return estimateVisionCostUsd(VISION_MODEL_BY_PROVIDER.openai);
  }
  let max = 0;
  for (const name of configuredProviders) {
    if (!VISION_PROVIDERS.includes(name as (typeof VISION_PROVIDERS)[number])) continue;
    const model = VISION_MODEL_BY_PROVIDER[name] ?? VISION_MODEL_BY_PROVIDER.openai;
    const cost = estimateVisionCostUsd(model);
    if (cost > max) max = cost;
  }
  return max;
}
