/**
 * Single entry point for vision analysis. All AI calls must go through this service.
 * Enforces: Policy Engine → Provider Router (circuit breaker / fallback) → usage recording.
 * Used by analyze-image route and by job handlers (ai-analyze-media).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { DailyWorkVideoAnalysis } from "@aistroyka/contracts";
import { logStructured } from "@/lib/observability";
import { runPolicy } from "@/lib/platform/ai-governance/policy.service";
import { maxVideoBytesForSubscriptionTier } from "@/lib/platform/ai-governance/policy.rules";
import { invokeVisionWithRouter } from "@/lib/platform/ai/providers/provider.router";
import { invokeGeminiDailyWorkVideoAnalysis } from "@/lib/platform/ai/providers/gemini-daily-work-video";
import { FetchBinaryCapError, fetchBinaryWithByteCap } from "@/lib/platform/ai/fetch-binary-capped";
import { recordUsage } from "@/lib/platform/ai-usage/ai-usage.service";
import { estimateCostUsd } from "@/lib/platform/ai-usage/cost-estimator";
import { parseJsonFromContent, normalizeStage, sanitizeAnalysisResult } from "@/lib/ai/normalize";
import { calibrateRiskLevel } from "@/lib/ai/riskCalibration";
import type { AnalysisResult, RiskLevel } from "@/lib/ai/types";

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

export class AIVideoDailyFailedError extends Error {
  constructor(message: string = "Video daily analysis failed") {
    super(message);
    this.name = "AIVideoDailyFailedError";
  }
}

export interface AnalyzeImageInput {
  imageUrl: string;
  projectId?: string | null;
  mediaId?: string | null;
  reportId?: string | null;
}

export interface AnalyzeVideoDailyInput {
  videoUrl: string;
  workDate?: string | null;
  projectId?: string | null;
  mediaId?: string | null;
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

const MAX_VIDEO_ARRAY_ITEMS = 24;
const MAX_VIDEO_STRING_LEN = 500;

function sanitizeStringArrayVideo(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  const seen = new Set<string>();
  return arr
    .filter((s): s is string => typeof s === "string")
    .map((s) => s.trim().slice(0, MAX_VIDEO_STRING_LEN))
    .filter((s) => {
      if (s.length === 0 || seen.has(s)) return false;
      seen.add(s);
      return true;
    })
    .slice(0, MAX_VIDEO_ARRAY_ITEMS);
}

function rawToDailyWorkVideoAnalysis(raw: Record<string, unknown>): DailyWorkVideoAnalysis {
  const workDate = typeof raw.work_date === "string" && raw.work_date.trim() ? raw.work_date.trim() : "unknown";
  const summary =
    typeof raw.summary === "string" && raw.summary.trim()
      ? raw.summary.trim().slice(0, 4000)
      : "No summary returned.";
  const activities = sanitizeStringArrayVideo(raw.activities_observed);
  const materials = sanitizeStringArrayVideo(raw.materials_or_equipment_visible);
  const pct =
    typeof raw.completion_estimate_percent === "number" && Number.isFinite(raw.completion_estimate_percent)
      ? Math.min(100, Math.max(0, Math.round(raw.completion_estimate_percent)))
      : 0;
  const issues = sanitizeStringArrayVideo(raw.issues_and_risks);
  const recs = sanitizeStringArrayVideo(raw.recommendations);
  const visibility =
    typeof raw.visibility_notes === "string" && raw.visibility_notes.trim()
      ? raw.visibility_notes.trim().slice(0, 2000)
      : undefined;

  return {
    work_date: workDate,
    summary,
    activities_observed: activities,
    materials_or_equipment_visible: materials.length ? materials : undefined,
    completion_estimate_percent: pct,
    risk_level: parseRiskLevel(String(raw.risk_level ?? "medium")),
    issues_and_risks: issues,
    recommendations: recs,
    visibility_notes: visibility,
  };
}

/** Structured AI request telemetry (no secrets). */
function logAiRequest(payload: {
  provider: string;
  model: string;
  tier: string;
  latency_ms: number;
  tokens_in: number;
  tokens_out: number;
  estimated_cost: number;
  policy_decision_id?: string | null;
  result_status: "success" | "failure";
  tenant_id?: string | null;
  user_id?: string | null;
  request_id?: string | null;
  error_code?: string;
  provider_error_type?: "retryable" | "auth" | "invalid_request";
}) {
  if (process.env.NODE_ENV === "test") return;
  logStructured({
    event: "ai_request",
    ...payload,
  });
}

export async function analyzeImage(
  admin: SupabaseClient,
  ctx: { tenantId: string | null; userId: string | null; subscriptionTier?: string | null; traceId?: string | null },
  input: AnalyzeImageInput
): Promise<AnalysisResult> {
  const startMs = Date.now();
  const tier = ctx.subscriptionTier ?? "free";
  let policyDecisionId: string | null = null;

  if (ctx.tenantId) {
    const policyResult = await runPolicy(
      admin,
      {
        tenant_id: ctx.tenantId,
        subscription_tier: tier,
        resource_type: "media",
        image_count: 1,
        image_url: input.imageUrl ?? null,
      },
      ctx.traceId ?? null
    );
    policyDecisionId = policyResult.decisionId ?? null;

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
  const usage = visionResult.usage;
  const ti = typeof usage?.prompt_tokens === "number" ? usage.prompt_tokens : 500;
  const to = typeof usage?.completion_tokens === "number" ? usage.completion_tokens : 300;
  const costEstUsd = estimateCostUsd(visionResult.modelUsed, ti, to);

  logAiRequest({
    provider: visionResult.providerUsed,
    model: visionResult.modelUsed,
    tier,
    latency_ms: durationMs,
    tokens_in: ti,
    tokens_out: to,
    estimated_cost: costEstUsd,
    policy_decision_id: policyDecisionId,
    result_status: "success",
    tenant_id: ctx.tenantId,
    user_id: ctx.userId ?? null,
    request_id: ctx.traceId ?? null,
  });

  if (ctx.tenantId) {
    await recordUsage(admin, {
      tenant_id: ctx.tenantId,
      user_id: ctx.userId ?? null,
      trace_id: ctx.traceId ?? null,
      provider: visionResult.providerUsed,
      model: visionResult.modelUsed,
      tokens_input: ti,
      tokens_output: to,
      tokens_total: ti + to,
      cost_usd: costEstUsd,
      status: "success",
      duration_ms: durationMs,
    });
  }

  return result;
}

export async function analyzeVideoDailyWork(
  admin: SupabaseClient,
  ctx: { tenantId: string | null; userId: string | null; subscriptionTier?: string | null; traceId?: string | null },
  input: AnalyzeVideoDailyInput
): Promise<DailyWorkVideoAnalysis> {
  const startMs = Date.now();
  const tier = ctx.subscriptionTier ?? "free";
  let policyDecisionId: string | null = null;

  const tierMax = maxVideoBytesForSubscriptionTier(tier);
  const envCap = Number(process.env.GEMINI_VIDEO_FETCH_MAX_BYTES);
  const absCap =
    Number.isFinite(envCap) && envCap > 0 ? Math.min(envCap, tierMax) : Math.min(45 * 1024 * 1024, tierMax);

  let videoBytes: Uint8Array;
  let videoMime: string;
  try {
    const fetched = await fetchBinaryWithByteCap(input.videoUrl, absCap);
    videoBytes = fetched.data;
    videoMime = fetched.contentType;
  } catch (e) {
    if (e instanceof FetchBinaryCapError && e.code === "too_large") {
      throw new AIPolicyBlockedError("Video exceeds size limit for this plan");
    }
    throw new AIVideoDailyFailedError(e instanceof Error ? e.message : "Video fetch failed");
  }

  if (ctx.tenantId) {
    const policyResult = await runPolicy(
      admin,
      {
        tenant_id: ctx.tenantId,
        subscription_tier: tier,
        resource_type: "media",
        image_count: 1,
        video_url: input.videoUrl,
        video_size_bytes: videoBytes.length,
      },
      ctx.traceId ?? null
    );
    policyDecisionId = policyResult.decisionId ?? null;

    if (policyResult.decision === "block") {
      throw new AIPolicyBlockedError("AI policy blocked");
    }
  }

  const workDateLabel = input.workDate?.trim() ?? "";

  let visionResult;
  try {
    visionResult = await invokeGeminiDailyWorkVideoAnalysis({
      videoBytes,
      videoMimeType: videoMime,
      workDateLabel,
      maxOutputTokens: 2048,
    });
  } catch (e) {
    throw new AIVideoDailyFailedError(e instanceof Error ? e.message : "Video analysis failed");
  }

  if (!visionResult) {
    throw new AIVideoDailyFailedError("Gemini video analysis is not configured");
  }

  let parsed: unknown;
  try {
    parsed = parseJsonFromContent(visionResult.content);
  } catch {
    throw new AIVideoDailyFailedError("AI returned non-JSON");
  }

  const raw = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  let result = rawToDailyWorkVideoAnalysis(raw);
  const forRisk: AnalysisResult = {
    stage: "unknown",
    completion_percent: result.completion_estimate_percent,
    risk_level: result.risk_level,
    detected_issues: [...result.activities_observed, ...result.issues_and_risks],
    recommendations: result.recommendations,
  };
  result = { ...result, risk_level: calibrateRiskLevel(forRisk) };

  const durationMs = Date.now() - startMs;
  const usage = visionResult.usage;
  const ti = typeof usage?.prompt_tokens === "number" ? usage.prompt_tokens : 2000;
  const to = typeof usage?.completion_tokens === "number" ? usage.completion_tokens : 400;
  const costEstUsd = estimateCostUsd(visionResult.modelUsed, ti, to);

  logAiRequest({
    provider: visionResult.providerUsed,
    model: visionResult.modelUsed,
    tier,
    latency_ms: durationMs,
    tokens_in: ti,
    tokens_out: to,
    estimated_cost: costEstUsd,
    policy_decision_id: policyDecisionId,
    result_status: "success",
    tenant_id: ctx.tenantId,
    user_id: ctx.userId ?? null,
    request_id: ctx.traceId ?? null,
  });

  if (ctx.tenantId) {
    await recordUsage(admin, {
      tenant_id: ctx.tenantId,
      user_id: ctx.userId ?? null,
      trace_id: ctx.traceId ?? null,
      provider: visionResult.providerUsed,
      model: visionResult.modelUsed,
      tokens_input: ti,
      tokens_output: to,
      tokens_total: ti + to,
      cost_usd: costEstUsd,
      status: "success",
      duration_ms: durationMs,
    });
  }

  return result;
}
