/**
 * In-app AI analysis endpoint (construction site image → structured result).
 *
 * Contract:
 * - Request: POST JSON { image_url (required), media_id?, project_id? }.
 * - Requires tenant auth (or valid x-cron-secret for internal job workers). When project_id is set: also requires project membership (403 Insufficient rights).
 * - Response: 200 with AnalysisResult { stage, completion_percent, risk_level, detected_issues, recommendations }.
 * - Degraded success: 200 deterministic AnalysisResult when vision routers fail but `AI_VISION_DETERMINISTIC_FALLBACK` is enabled (default); `X-AI-Fallback-Reason` header set.
 * - Errors: 400 (bad body), 413 (body too large), 402 (quota), 429 (rate limit), 403 (policy block), 502/504 (AI when fallback disabled), 503 (no vision provider configured).
 *
 * All AI calls go through AIService (Policy Engine → Provider Router → usage).
 * Phase 8: vision telemetry + audit (no image URLs or prompts in logs).
 */

import { NextResponse } from "next/server";
import {
  getTenantContextFromRequest,
  isTenantContextPresent,
  requireTenant,
  TenantRequiredError,
} from "@/lib/tenant";
import { getProjectForInternalWorkspace } from "@/lib/domain/projects/project.service";
import { getAdminClient } from "@/lib/supabase/admin";
import { createClientFromRequest } from "@/lib/supabase/server";
import { hasValidCronSecret } from "@/lib/api/cron-auth";
import { checkRateLimit } from "@/lib/platform/rate-limit/rate-limit.service";
import { checkQuota, checkBudgetAlert, estimateMaxVisionCostUsd } from "@/lib/platform/ai-usage/ai-usage.service";
import { analyzeImage, AIPolicyBlockedError, AIVisionFailedError } from "@/lib/platform/ai/ai.service";
import { getServerConfig, getConfiguredVisionProviders, isAnyVisionProviderConfigured } from "@/lib/config/server";
import { logStructured, withRequestIdAndTiming, getOrCreateRequestId } from "@/lib/observability";
import {
  logVisionAnalyzeComplete,
  logVisionAnalyzeError,
  getAiReleaseCorrelation,
} from "@/lib/observability/ai-telemetry";
import { emitAiRuntimeAudit } from "@/lib/observability/audit.service";
import { AnalyzeImageRequestSchema, AnalysisResultSchema } from "@aistroyka/contracts";

const MAX_IMAGE_URL_LENGTH = 2048;
const MAX_BODY_BYTES = 100_000;
const ROUTE_KEY = "POST /api/v1/ai/analyze-image";

function shouldUseVisionFallback(): boolean {
  const raw = (process.env.AI_VISION_DETERMINISTIC_FALLBACK ?? "true").trim().toLowerCase();
  return raw !== "0" && raw !== "false" && raw !== "off" && raw !== "no";
}

function buildVisionDeterministicFallback(reason: "provider_unavailable" | "provider_timeout") {
  return {
    stage: "unknown",
    completion_percent: 0,
    risk_level: "medium",
    detected_issues: [
      reason === "provider_timeout"
        ? "Vision provider timeout: analysis completed in deterministic fallback mode."
        : "Vision providers are temporarily unavailable: analysis completed in deterministic fallback mode.",
    ],
    recommendations: [
      "Retry image analysis in a few minutes when AI providers recover.",
      "Proceed with manual visual checklist for safety-critical observations.",
      "Attach additional evidence and rerun for AI-enriched details.",
    ],
  } as const;
}

function validateImageUrl(
  url: string
): { ok: true } | { ok: false; error: string } {
  if (url.length > MAX_IMAGE_URL_LENGTH) {
    return { ok: false, error: "image_url too long" };
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, error: "image_url must be a valid URL" };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "image_url must be http or https" };
  }
  if (getServerConfig().NODE_ENV === "production" && parsed.protocol !== "https:") {
    return { ok: false, error: "image_url must be https in production" };
  }
  return { ok: true };
}

export async function POST(request: Request) {
  const start = Date.now();
  const requestId = getOrCreateRequestId(request);
  const wrap = (res: NextResponse, tenantId?: string | null, userId?: string | null) =>
    withRequestIdAndTiming(request, res, { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start, tenantId, userId });

  const rel = () => getAiReleaseCorrelation();

  if (!isAnyVisionProviderConfigured()) {
    logVisionAnalyzeError({
      request_id: requestId,
      route: ROUTE_KEY,
      latency_ms: Date.now() - start,
      error_kind: "provider_unavailable",
      http_status: 503,
      ...rel(),
    });
    return wrap(NextResponse.json({ error: "No AI vision provider is configured", request_id: requestId }, { status: 503 }));
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

  const parsed = AnalyzeImageRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    const msg = parsed.error.flatten().formErrors[0] ?? parsed.error.flatten().fieldErrors.image_url?.[0] ?? "Invalid request body";
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

  const imageUrl = parsed.data.image_url.trim();
  const urlCheck = validateImageUrl(imageUrl);
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
  const userSupabase = await createClientFromRequest(request);
  const cronAuthorized = hasValidCronSecret(request);

  try {
    requireTenant(tenantCtx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      if (!cronAuthorized) {
        logVisionAnalyzeError({
          request_id: requestId,
          route: ROUTE_KEY,
          tenant_id: tenantCtx.tenantId,
          latency_ms: Date.now() - start,
          error_kind: "auth_failure",
          http_status: 401,
          ...rel(),
        });
        return wrap(
          NextResponse.json({ error: e.message, request_id: requestId }, { status: 401 }),
          tenantCtx.tenantId,
          tenantCtx.userId
        );
      }
    } else {
      throw e;
    }
  }

  const projectId = parsed.data.project_id?.trim() || null;
  if (projectId && isTenantContextPresent(tenantCtx)) {
    const { data: project, error: projectError } = await getProjectForInternalWorkspace(
      userSupabase,
      tenantCtx,
      projectId
    );
    if (projectError || !project) {
      const status = projectError === "Insufficient rights" ? 403 : 404;
      logVisionAnalyzeError({
        request_id: requestId,
        route: ROUTE_KEY,
        tenant_id: tenantCtx.tenantId,
        project_id: projectId,
        latency_ms: Date.now() - start,
        error_kind: status === 403 ? "tenant_failure" : "validation_failure",
        http_status: status,
        ...rel(),
      });
      return wrap(
        NextResponse.json({ error: projectError ?? "Not found", request_id: requestId }, { status }),
        tenantCtx.tenantId,
        tenantCtx.userId
      );
    }
  }

  const admin = getAdminClient();
  if (admin) {
    try {
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
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
      const estimatedCost = estimateMaxVisionCostUsd(getConfiguredVisionProviders(), tier);
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
    return wrap(NextResponse.json({ error: "No AI vision provider is configured", request_id: requestId }, { status: 503 }), tenantCtx.tenantId, tenantCtx.userId);
  }

  try {
    const result = await analyzeImage(admin, {
      tenantId: tenantCtx.tenantId ?? null,
      userId: tenantCtx.userId ?? null,
      subscriptionTier: tenantCtx.subscriptionTier ?? "free",
      traceId: requestId,
    }, {
      imageUrl,
      projectId: parsed.data.project_id ?? null,
      mediaId: parsed.data.media_id ?? null,
    });

    const durationMs = Date.now() - start;
    const r = rel();
    logVisionAnalyzeComplete({
      request_id: requestId,
      route: ROUTE_KEY,
      tenant_id: tenantCtx.tenantId,
      project_id: parsed.data.project_id ?? null,
      user_id: tenantCtx.userId ?? null,
      latency_ms: durationMs,
      output_type: "vision",
      result_status: "success",
      provider: "vision_router",
      media_id: parsed.data.media_id ?? null,
      ...r,
    });
    if (tenantCtx.tenantId) {
      void emitAiRuntimeAudit(userSupabase, {
        tenant_id: tenantCtx.tenantId,
        user_id: tenantCtx.userId ?? null,
        trace_id: requestId,
        project_id: parsed.data.project_id ?? null,
        action: "ai_vision_analyze_complete",
        details: {
          request_id: requestId,
          route: ROUTE_KEY,
          latency_ms: durationMs,
          output_type: "vision",
          provider: "vision_router",
          ...r,
        },
      });
    }
    const validated = AnalysisResultSchema.safeParse(result);
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
          action: "ai_vision_analyze_error",
          details: {
            request_id: requestId,
            route: ROUTE_KEY,
            latency_ms: durationMs,
            output_type: "vision",
            error_kind: "output_validation_failure",
            ...r,
          },
        });
      }
      return wrap(NextResponse.json({ error: err.message, code: "ai_policy_denied", request_id: requestId }, { status: 403 }), tenantCtx.tenantId, tenantCtx.userId);
    }
    if (err instanceof AIVisionFailedError) {
      const isTimeout = err.message.toLowerCase().includes("timeout");
      const ek = isTimeout ? "provider_timeout" : "provider_unavailable";
      const fallbackEnabled = shouldUseVisionFallback();
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
          action: "ai_vision_analyze_error",
          details: {
            request_id: requestId,
            route: ROUTE_KEY,
            latency_ms: durationMs,
            output_type: "vision",
            error_kind: ek,
            ...r,
          },
        });
      }
      if (fallbackEnabled) {
        const fallbackResult = buildVisionDeterministicFallback(ek);
        logVisionAnalyzeComplete({
          request_id: requestId,
          route: ROUTE_KEY,
          tenant_id: tenantCtx.tenantId,
          project_id: parsed.data.project_id ?? null,
          user_id: tenantCtx.userId ?? null,
          latency_ms: durationMs,
          output_type: "vision",
          result_status: "success",
          provider: "none",
          error_kind: "fallback_invoked",
          media_id: parsed.data.media_id ?? null,
          ...r,
        });
        if (tenantCtx.tenantId) {
          void emitAiRuntimeAudit(userSupabase, {
            tenant_id: tenantCtx.tenantId,
            user_id: tenantCtx.userId ?? null,
            trace_id: requestId,
            project_id: parsed.data.project_id ?? null,
            action: "ai_vision_analyze_complete",
            details: {
              request_id: requestId,
              route: ROUTE_KEY,
              latency_ms: durationMs,
              output_type: "vision",
              provider: "none",
              fallback_triggered: true,
              fallback_reason: ek,
              ...r,
            },
          });
        }
        const fallbackResponse = NextResponse.json(fallbackResult, { status: 200 });
        fallbackResponse.headers.set("X-AI-Fallback-Reason", ek);
        fallbackResponse.headers.set("X-Request-Id", requestId);
        return wrap(fallbackResponse, tenantCtx.tenantId, tenantCtx.userId);
      }
      return wrap(NextResponse.json({ error: err.message, request_id: requestId }, { status: isTimeout ? 504 : 502 }), tenantCtx.tenantId, tenantCtx.userId);
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
        action: "ai_vision_analyze_error",
        details: {
          request_id: requestId,
          route: ROUTE_KEY,
          latency_ms: durationMs,
          output_type: "vision",
          error_kind: "unknown_internal_error",
          ...r,
        },
      });
    }
    return wrap(NextResponse.json({ error: message, request_id: requestId }, { status: 500 }), tenantCtx.tenantId, tenantCtx.userId);
  }
}
