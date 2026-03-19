/**
 * Cost estimate from image: vision with cost prompt, parse, return structured output.
 * Reuses policy + vision router + usage; does not persist (caller persists to estimate.repository).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { runPolicy } from "@/lib/platform/ai-governance/policy.service";
import { invokeVisionWithRouter } from "@/lib/platform/ai/providers/provider.router";
import { recordUsage } from "@/lib/platform/ai-usage/ai-usage.service";
import { estimateCostUsd } from "@/lib/platform/ai-usage/cost-estimator";
import { COST_ESTIMATE_VISION_SYSTEM_PROMPT, COST_ESTIMATE_VISION_USER_MESSAGE } from "@/lib/ai/prompts";
import { parseJsonFromContent } from "@/lib/ai/normalize";
import type { CostVisionOutput } from "./estimate.types";
import type { EstimateConfidence } from "./estimate.types";

function parseConfidence(s: unknown): EstimateConfidence {
  const v = String(s ?? "").toLowerCase();
  if (v === "low" || v === "medium" || v === "high") return v;
  return "low";
}

export function parseCostVisionOutput(content: string): CostVisionOutput {
  const raw = parseJsonFromContent(content) as Record<string, unknown>;
  const work_categories = Array.isArray(raw.work_categories)
    ? (raw.work_categories as unknown[]).filter((c): c is string => typeof c === "string")
    : [];
  const rough_range_min =
    typeof raw.rough_range_min === "number" && Number.isFinite(raw.rough_range_min)
      ? raw.rough_range_min
      : null;
  const rough_range_max =
    typeof raw.rough_range_max === "number" && Number.isFinite(raw.rough_range_max)
      ? raw.rough_range_max
      : null;
  const currency_hint =
    typeof raw.currency_hint === "string" && raw.currency_hint.trim()
      ? raw.currency_hint.trim()
      : null;
  const missing_data_reasons = Array.isArray(raw.missing_data_reasons)
    ? (raw.missing_data_reasons as unknown[]).filter((r): r is string => typeof r === "string")
    : [];
  const assumption_notes =
    typeof raw.assumption_notes === "string" && raw.assumption_notes.trim()
      ? raw.assumption_notes.trim()
      : null;

  return {
    work_categories,
    rough_range_min,
    rough_range_max,
    currency_hint,
    confidence: parseConfidence(raw.confidence),
    missing_data_reasons,
    assumption_notes,
  };
}

export interface AnalyzeImageForCostInput {
  imageUrl: string;
  tenantId: string | null;
  userId: string | null;
  subscriptionTier?: string | null;
  traceId?: string | null;
}

export class CostVisionFailedError extends Error {
  constructor(message: string = "Cost vision analysis failed") {
    super(message);
    this.name = "CostVisionFailedError";
  }
}

export async function analyzeImageForCost(
  admin: SupabaseClient,
  input: AnalyzeImageForCostInput
): Promise<CostVisionOutput> {
  const tier = input.subscriptionTier ?? "free";

  if (input.tenantId) {
    const policyResult = await runPolicy(
      admin,
      {
        tenant_id: input.tenantId,
        subscription_tier: tier,
        resource_type: "media",
        image_count: 1,
        image_url: input.imageUrl,
      },
      input.traceId ?? null
    );
    if (policyResult.decision === "block") {
      throw new CostVisionFailedError("AI policy blocked");
    }
  }

  const visionResult = await invokeVisionWithRouter(admin, input.imageUrl, {
    tier,
    maxTokens: 1024,
    tenantId: input.tenantId,
    requestId: input.traceId ?? undefined,
    systemPrompt: COST_ESTIMATE_VISION_SYSTEM_PROMPT,
    userMessage: COST_ESTIMATE_VISION_USER_MESSAGE,
  });

  if (!visionResult) {
    throw new CostVisionFailedError("All AI providers failed or are unavailable");
  }

  let output: CostVisionOutput;
  try {
    output = parseCostVisionOutput(visionResult.content);
  } catch {
    throw new CostVisionFailedError("AI returned invalid cost estimate structure");
  }
  const usage = visionResult.usage;
  const ti = typeof usage?.prompt_tokens === "number" ? usage.prompt_tokens : 500;
  const to = typeof usage?.completion_tokens === "number" ? usage.completion_tokens : 300;
  const costEstUsd = estimateCostUsd(visionResult.modelUsed, ti, to);

  if (input.tenantId) {
    await recordUsage(admin, {
      tenant_id: input.tenantId,
      user_id: input.userId,
      trace_id: input.traceId ?? null,
      provider: visionResult.providerUsed,
      model: visionResult.modelUsed,
      tokens_input: ti,
      tokens_output: to,
      tokens_total: ti + to,
      cost_usd: costEstUsd,
      status: "success",
      duration_ms: 0,
    });
  }

  return output;
}
