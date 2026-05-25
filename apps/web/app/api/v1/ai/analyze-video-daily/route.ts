/**
 * POST /api/v1/ai/analyze-video-daily — construction site video → structured “work done for the day”.
 *
 * Request: JSON { video_url (required), work_date? (YYYY-MM-DD), media_id?, project_id? }.
 * Response: 200 DailyWorkVideoAnalysis (see @aistroyka/contracts).
 * Requires Gemini (GOOGLE_AI_API_KEY or GEMINI_API_KEY). No OpenAI/Anthropic fallback for native video.
 */

import { NextResponse } from "next/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getAdminClient } from "@/lib/supabase/admin";
import { createClientFromRequest } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/platform/rate-limit/rate-limit.service";
import { checkQuota, checkBudgetAlert, estimateGeminiVideoDailyQuotaReserveUsd } from "@/lib/platform/ai-usage/ai-usage.service";
import { analyzeVideoDailyWork, AIPolicyBlockedError, AIVideoDailyFailedError } from "@/lib/platform/ai/ai.service";
import { getServerConfig, isGeminiConfigured } from "@/lib/config/server";
import { logStructured, withRequestIdAndTiming, getOrCreateRequestId } from "@/lib/observability";
import {
  logVisionAnalyzeComplete,
  logVisionAnalyzeError,
  getAiReleaseCorrelation,
} from "@/lib/observability/ai-telemetry";
import { emitAiRuntimeAudit } from "@/lib/observability/audit.service";
import { AnalyzeVideoDailyRequestSchema, DailyWorkVideoAnalysisSchema } from "@aistroyka/contracts";

const MAX_VIDEO_URL_LENGTH = 2048;
const MAX_BODY_BYTES = 100_000;
const ROUTE_KEY = "POST /api/v1/ai/analyze-video-daily";

function validateVideoUrl(url: string): { ok: true } | { ok: false; error: string } {
  if (url.length > MAX_VIDEO_URL_LENGTH) {
    return { ok: false, error: "video_url too long" };
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, error: "video_url must be a valid URL" };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "video_url must be http or https" };
  }
  if (getServerConfig().NODE_ENV === "production" && parsed.protocol !== "https:") {
    return { ok: false, error: "video_url must be https in production" };
  }
  return { ok: true };
}

export async function POST(request: Request) {
  const start = Date.now();
  const requestId = getOrCreateRequestId(request);
  const wrap = (res: NextResponse, tenantId?: string | null, userId?: string | null) =>
    withRequestIdAndTiming(request, res, { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start, tenantId, userId });

  const rel = () => getAiReleaseCorrelation();

  if (!isGeminiConfigured()) {
    logVisionAnalyzeError({
      request_id: requestId,
      route: ROUTE_KEY,
      latency_ms: Date.now() - start,
      error_kind: "provider_unavailable",
      http_status: 503,
      ...rel(),
    });
    return wrap(
      NextResponse.json(
        { error: "Gemini is required for video daily analysis (set GOOGLE_AI_API_KEY or GEMINI_API_KEY)", request_id: requestId },
        { status: 503 }
      )
    );
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength !== null && contentLength !== "" && Number(contentLength) > MAX_BODY_BYTES) {
    logVisionAnalyzeError({
      request_id: requestId,
      route: ROUTE_KEY,
      latency_ms: Date.now() - start,
      error_kind: "validation_failure",
      http_status: 413,
      ...rel(),
    });
    return wrap(NextResponse.json({ error: "Request body too large", request_id: requestId }, { status: 413 }));
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    logVisionAnalyzeError({
      request_id: requestId,
      route: ROUTE_KEY,
      latency_ms: Date.now() - start,
      error_kind: "validation_failure",
      http_status: 400,
      ...rel(),
    });
    return wrap(NextResponse.json({ error: "Invalid JSON body", request_id: requestId }, { status: 400 }));
  }

  const parsed = AnalyzeVideoDailyRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    const msg =
      parsed.error.flatten().formErrors[0] ??
      parsed.error.flatten().fieldErrors.video_url?.[0] ??
      "Invalid request body";
    logVisionAnalyzeError({
      request_id: requestId,
      route: ROUTE_KEY,
      latency_ms: Date.now() - start,
      error_kind: "validation_failure",
      http_status: 400,
      ...rel(),
    });
    return wrap(NextResponse.json({ error: msg, request_id: requestId }, { status: 400 }));
  }

  const videoUrl = parsed.data.video_url.trim();
  const urlCheck = validateVideoUrl(videoUrl);
  if (!urlCheck.ok) {
    logVisionAnalyzeError({
      request_id: requestId,
      route: ROUTE_KEY,
      latency_ms: Date.now() - start,
      error_kind: "validation_failure",
      http_status: 400,
      ...rel(),
    });
    return wrap(NextResponse.json({ error: urlCheck.error, request_id: requestId }, { status: 400 }));
  }

  const tenantCtx = await getTenantContextFromRequest(request);
  try {
    requireTenant(tenantCtx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      logVisionAnalyzeError({
        request_id: requestId,
        route: ROUTE_KEY,
        tenant_id: tenantCtx.tenantId,
        latency_ms: Date.now() - start,
        error_kind: "validation_failure",
        http_status: 401,
        ...rel(),
      });
      return wrap(NextResponse.json({ error: e.message, request_id: requestId }, { status: 401 }), tenantCtx.tenantId, tenantCtx.userId);
    }
    throw e;
  }
  const userSupabase = await createClientFromRequest(request);
  const admin = getAdminClient();
  if (admin) {
    try {
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        request.headers.get("x-real-ip") ??
        "unknown";
      const result = await checkRateLimit(admin, {
        tenantId: tenantCtx.tenantId ?? null,
        ip,
        endpoint: ROUTE_KEY,
      });
      if (result.limited) {
        logVisionAnalyzeError({
          request_id: requestId,
          route: ROUTE_KEY,
          tenant_id: tenantCtx.tenantId,
          latency_ms: Date.now() - start,
          error_kind: "rate_limit",
          http_status: 429,
          ...rel(),
        });
        return wrap(NextResponse.json({ error: result.message, request_id: requestId }, { status: 429 }), tenantCtx.tenantId, tenantCtx.userId);
      }
    } catch {
      logStructured({ event: "rate_limit_unavailable", endpoint: ROUTE_KEY, tenant_id: tenantCtx.tenantId ?? undefined, request_id: requestId });
    }
    if (tenantCtx.tenantId) {
      const tier = tenantCtx.subscriptionTier ?? "free";
      const estimatedCost = estimateGeminiVideoDailyQuotaReserveUsd(tier);
      const quotaMsg = await checkQuota(admin, tenantCtx.tenantId, estimatedCost);
      if (quotaMsg) {
        logVisionAnalyzeError({
          request_id: requestId,
          route: ROUTE_KEY,
          tenant_id: tenantCtx.tenantId,
          latency_ms: Date.now() - start,
          error_kind: "rate_limit",
          http_status: 402,
          ...rel(),
        });
        return wrap(
          NextResponse.json({ error: quotaMsg, code: "ai_budget_exceeded", request_id: requestId }, { status: 402 }),
          tenantCtx.tenantId,
          tenantCtx.userId
        );
      }
      await checkBudgetAlert(admin, tenantCtx.tenantId, estimatedCost);
    }
  }

  if (!admin) {
    logVisionAnalyzeError({
      request_id: requestId,
      route: ROUTE_KEY,
      tenant_id: tenantCtx.tenantId,
      latency_ms: Date.now() - start,
      error_kind: "provider_unavailable",
      http_status: 503,
      ...rel(),
    });
    return wrap(
      NextResponse.json({ error: "Service configuration unavailable for usage tracking", request_id: requestId }, { status: 503 }),
      tenantCtx.tenantId,
      tenantCtx.userId
    );
  }

  try {
    const result = await analyzeVideoDailyWork(
      admin,
      {
        tenantId: tenantCtx.tenantId ?? null,
        userId: tenantCtx.userId ?? null,
        subscriptionTier: tenantCtx.subscriptionTier ?? "free",
        traceId: requestId,
      },
      {
        videoUrl,
        workDate: parsed.data.work_date ?? null,
        projectId: parsed.data.project_id ?? null,
        mediaId: parsed.data.media_id ?? null,
      }
    );

    const durationMs = Date.now() - start;
    const r = rel();
    logVisionAnalyzeComplete({
      request_id: requestId,
      route: ROUTE_KEY,
      tenant_id: tenantCtx.tenantId,
      project_id: parsed.data.project_id ?? null,
      user_id: tenantCtx.userId ?? null,
      latency_ms: durationMs,
      output_type: "video_daily",
      result_status: "success",
      provider: "gemini",
      media_id: parsed.data.media_id ?? null,
      ...r,
    });
    if (tenantCtx.tenantId) {
      void emitAiRuntimeAudit(userSupabase, {
        tenant_id: tenantCtx.tenantId,
        user_id: tenantCtx.userId ?? null,
        trace_id: requestId,
        project_id: parsed.data.project_id ?? null,
        action: "ai_video_daily_complete",
        details: {
          request_id: requestId,
          route: ROUTE_KEY,
          latency_ms: durationMs,
          output_type: "video_daily",
          provider: "gemini",
          ...r,
        },
      });
    }
    const validated = DailyWorkVideoAnalysisSchema.safeParse(result);
    const bodyToReturn = validated.success ? validated.data : result;
    const response = NextResponse.json(bodyToReturn);
    response.headers.set("X-AI-Duration-Ms", String(durationMs));
    response.headers.set("X-Request-Id", requestId);
    return wrap(response, tenantCtx.tenantId, tenantCtx.userId);
  } catch (err) {
    const durationMs = Date.now() - start;
    const r = rel();
    if (err instanceof AIPolicyBlockedError) {
      logVisionAnalyzeError({
        request_id: requestId,
        route: ROUTE_KEY,
        tenant_id: tenantCtx.tenantId,
        project_id: parsed.data.project_id ?? null,
        latency_ms: durationMs,
        error_kind: "output_validation_failure",
        http_status: 403,
        ...r,
      });
      if (tenantCtx.tenantId) {
        void emitAiRuntimeAudit(userSupabase, {
          tenant_id: tenantCtx.tenantId,
          user_id: tenantCtx.userId ?? null,
          trace_id: requestId,
          project_id: parsed.data.project_id ?? null,
          action: "ai_video_daily_error",
          details: {
            request_id: requestId,
            route: ROUTE_KEY,
            latency_ms: durationMs,
            output_type: "video_daily",
            error_kind: "output_validation_failure",
            ...r,
          },
        });
      }
      return wrap(
        NextResponse.json({ error: err.message, code: "ai_policy_denied", request_id: requestId }, { status: 403 }),
        tenantCtx.tenantId,
        tenantCtx.userId
      );
    }
    if (err instanceof AIVideoDailyFailedError) {
      const isTimeout = err.message.toLowerCase().includes("timeout");
      const ek = isTimeout ? "provider_timeout" : "provider_unavailable";
      logVisionAnalyzeError({
        request_id: requestId,
        route: ROUTE_KEY,
        tenant_id: tenantCtx.tenantId,
        project_id: parsed.data.project_id ?? null,
        latency_ms: durationMs,
        error_kind: ek,
        http_status: isTimeout ? 504 : 502,
        ...r,
      });
      if (tenantCtx.tenantId) {
        void emitAiRuntimeAudit(userSupabase, {
          tenant_id: tenantCtx.tenantId,
          user_id: tenantCtx.userId ?? null,
          trace_id: requestId,
          project_id: parsed.data.project_id ?? null,
          action: "ai_video_daily_error",
          details: {
            request_id: requestId,
            route: ROUTE_KEY,
            latency_ms: durationMs,
            output_type: "video_daily",
            error_kind: ek,
            retryable: true,
            ...r,
          },
        });
      }
      return wrap(
        NextResponse.json({ error: err.message, request_id: requestId }, { status: isTimeout ? 504 : 502 }),
        tenantCtx.tenantId,
        tenantCtx.userId
      );
    }
    const message = err instanceof Error ? err.message : "Analysis failed";
    logVisionAnalyzeError({
      request_id: requestId,
      route: ROUTE_KEY,
      tenant_id: tenantCtx.tenantId,
      project_id: parsed.data.project_id ?? null,
      latency_ms: durationMs,
      error_kind: "unknown_internal_error",
      http_status: 500,
      ...r,
    });
    if (tenantCtx.tenantId) {
      void emitAiRuntimeAudit(userSupabase, {
        tenant_id: tenantCtx.tenantId,
        user_id: tenantCtx.userId ?? null,
        trace_id: requestId,
        project_id: parsed.data.project_id ?? null,
        action: "ai_video_daily_error",
        details: {
          request_id: requestId,
          route: ROUTE_KEY,
          latency_ms: durationMs,
          output_type: "video_daily",
          error_kind: "unknown_internal_error",
          ...r,
        },
      });
    }
    return wrap(NextResponse.json({ error: message, request_id: requestId }, { status: 500 }), tenantCtx.tenantId, tenantCtx.userId);
  }
}
