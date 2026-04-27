/**
 * Rate limit, quota, and policy checks before non-streaming Copilot LLM calls.
 * Mirrors the guard pattern used by vision analyze-image (without image-specific rules).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { checkRateLimit } from "@/lib/platform/rate-limit/rate-limit.service";
import { checkQuota, checkBudgetAlert } from "@/lib/platform/ai-usage/ai-usage.service";
import { estimateCostUsd } from "@/lib/platform/ai-usage/cost-estimator";
import { runPolicy } from "@/lib/platform/ai-governance/policy.service";
import { logStructured } from "@/lib/observability";

/** Conservative reservation for one Copilot brief (large context + completion). */
const COPILOT_BRIEF_RESERVE_MODEL = "gpt-4o-mini";
export const COPILOT_BRIEF_ESTIMATE_USD = estimateCostUsd(COPILOT_BRIEF_RESERVE_MODEL, 12_000, 2_000);

/** Higher reserve for streaming chat (longer context + completion). */
export const COPILOT_STREAM_ESTIMATE_USD = estimateCostUsd(COPILOT_BRIEF_RESERVE_MODEL, 16_000, 4_000);

export type CopilotLlmGateFailure = {
  ok: false;
  httpStatus: 402 | 403 | 429;
  message: string;
  code?: string;
};

export type CopilotLlmGateOk = { ok: true };

export type CopilotLlmGateResult = CopilotLlmGateOk | CopilotLlmGateFailure;

export async function gateCopilotLlmRequest(
  admin: SupabaseClient,
  input: {
    tenantId: string;
    userId: string | null;
    subscriptionTier: string | null;
    requestId: string;
    endpoint: string;
    request: Request;
    /** Quota/budget soft-check reservation; defaults to brief non-stream estimate. */
    estimatedCostUsd?: number;
  }
): Promise<CopilotLlmGateResult> {
  try {
    const ip =
      input.request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      input.request.headers.get("x-real-ip") ??
      "unknown";
    const rl = await checkRateLimit(admin, {
      tenantId: input.tenantId,
      ip,
      endpoint: input.endpoint,
    });
    if (rl.limited) {
      return { ok: false, httpStatus: 429, message: rl.message, code: "rate_limited" };
    }
  } catch {
    logStructured({
      event: "rate_limit_unavailable",
      endpoint: input.endpoint,
      tenant_id: input.tenantId,
      request_id: input.requestId,
    });
  }

  const tier = input.subscriptionTier ?? "free";
  const reserveUsd = input.estimatedCostUsd ?? COPILOT_BRIEF_ESTIMATE_USD;
  const quotaMsg = await checkQuota(admin, input.tenantId, reserveUsd);
  if (quotaMsg) {
    return {
      ok: false,
      httpStatus: 402,
      message: quotaMsg,
      code: "ai_budget_exceeded",
    };
  }
  await checkBudgetAlert(admin, input.tenantId, reserveUsd);

  const policyResult = await runPolicy(
    admin,
    {
      tenant_id: input.tenantId,
      subscription_tier: tier,
    },
    input.requestId
  );

  if (policyResult.decision === "block") {
    return {
      ok: false,
      httpStatus: 403,
      message: "AI policy blocked this request",
      code: "ai_policy_denied",
    };
  }

  return { ok: true };
}
