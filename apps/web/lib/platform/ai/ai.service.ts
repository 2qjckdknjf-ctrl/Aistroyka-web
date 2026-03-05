/**
 * Single entry point for vision analysis. All AI calls must go through this service.
 * Enforces: Policy Engine → Provider Router (circuit breaker / fallback) → usage recording.
 * Used by analyze-image route and by job handlers (ai-analyze-media).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { runPolicy } from "@/lib/platform/ai-governance/policy.service";
import { invokeVisionWithRouter } from "@/lib/platform/ai/providers/provider.router";
import { recordUsage } from "@/lib/platform/ai-usage/ai-usage.service";
import { estimateCostUsd } from "@/lib/platform/ai-usage/cost-estimator";
import { parseJsonFromContent, normalizeStage, sanitizeAnalysisResult } from "@/lib/ai/normalize";
import { calibrateRiskLevel } from "@/lib/ai/riskCalibration";
import type { AnalysisResult, RiskLevel } from "@/lib/ai/types";
import type { TenantContext } from "@/lib/tenant/tenant.types";

export class AIPolicyBlockedError extends Error {
  constructor(message: string = "AI policy blocked") {
    super(message);
    this.name = "AIPolicyBlockedError";
  }
}

export class AIVisionFailedError extends Error {
  constructor(message: string = "Vision analysis failed") {
    super(message);
    this.name = "AIVisionFailedError";
  }
}

export interface AnalyzeImageInput {
  imageUrl: string;
  projectId?: string | null;
  mediaId?: string | null;
  reportId?: string | null;
}

function parseRiskLevel(s: string): RiskLevel {
  const v = s?.toLowerCase();
  if (v === "low" || v === "medium" || v === "high") return v;
  return "medium";
}

function rawToAnalysisResult(raw: Record<string, unknown>): AnalysisResult {
  return {
    stage: normalizeStage(typeof raw.stage === "string" ? raw.stage : undefined),
    completion_percent:
      typeof raw.completion_percent === "number"
        ? Math.min(100, Math.max(0, Math.round(raw.completion_percent)))
        : 0,
    risk_level: parseRiskLevel(String(raw.risk_level ?? "medium")),
    detected_issues: Array.isArray(raw.detected_issues)
      ? (raw.detected_issues as unknown[]).filter((i) => typeof i === "string")
      : [],
    recommendations: Array.isArray(raw.recommendations)
      ? (raw.recommendations as unknown[]).filter((r) => typeof r === "string")
      : [],
  };
}

/**
 * Run vision analysis through Policy Engine → Provider Router → normalize → usage.
 * Returns the same AnalysisResult shape as the public API. Throws on policy block or provider failure.
 * When tenantId is null (unauthenticated), policy and usage recording are skipped.
 */
export async function analyzeImage(
  admin: SupabaseClient,
  ctx: { tenantId: string | null; userId: string | null; subscriptionTier?: string | null; traceId?: string | null },
  input: AnalyzeImageInput
): Promise<AnalysisResult> {
  const startMs = Date.now();
  const tier = ctx.subscriptionTier ?? "free";

  if (ctx.tenantId) {
    const policyResult = await runPolicy(
      admin,
      {
        tenant_id: ctx.tenantId,
        subscription_tier: tier,
        resource_type: "media",
        image_count: 1,
      },
      ctx.traceId ?? null
    );

    if (policyResult.decision === "block") {
      throw new AIPolicyBlockedError("AI policy blocked");
    }
  }

  const visionResult = await invokeVisionWithRouter(admin, input.imageUrl, {
    tier,
    maxTokens: 1024,
    tenantId: ctx.tenantId,
    requestId: ctx.traceId ?? undefined,
  });

  if (!visionResult) {
    throw new AIVisionFailedError("All AI providers failed or are unavailable");
  }

  let parsed: unknown;
  try {
    parsed = parseJsonFromContent(visionResult.content);
  } catch {
    throw new AIVisionFailedError("AI returned non-JSON");
  }

  const raw = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  let result = rawToAnalysisResult(raw);
  result = sanitizeAnalysisResult(result);
  result = { ...result, risk_level: calibrateRiskLevel(result) };

  const durationMs = Date.now() - startMs;
  if (ctx.tenantId) {
    const usage = visionResult.usage;
    const ti = typeof usage?.prompt_tokens === "number" ? usage.prompt_tokens : 500;
    const to = typeof usage?.completion_tokens === "number" ? usage.completion_tokens : 300;
    const cost = estimateCostUsd(visionResult.modelUsed, ti, to);
    await recordUsage(admin, {
      tenant_id: ctx.tenantId,
      user_id: ctx.userId ?? null,
      trace_id: ctx.traceId ?? null,
      provider: visionResult.providerUsed,
      model: visionResult.modelUsed,
      tokens_input: ti,
      tokens_output: to,
      tokens_total: ti + to,
      cost_usd: cost,
      status: "success",
      duration_ms: durationMs,
    });
  }

  return result;
}
