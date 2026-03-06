/**
 * In-app AI analysis endpoint (construction site image → structured result).
 *
 * Contract:
 * - Request: POST JSON { image_url (required), media_id?, project_id? }.
 * - Response: 200 with AnalysisResult { stage, completion_percent, risk_level, detected_issues, recommendations }.
 * - Errors: 400 (bad body), 413 (body too large), 402 (quota), 429 (rate limit), 403 (policy block), 502/504 (AI), 503 (no vision provider configured).
 *
 * All AI calls go through AIService (Policy Engine → Provider Router → usage).
 */

import { NextResponse } from "next/server";
import { setLegacyApiHeaders } from "@/lib/api/deprecation-headers";
import { getTenantContextFromRequest } from "@/lib/tenant";
import { getAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/platform/rate-limit/rate-limit.service";
import { checkQuota, checkBudgetAlert, estimateMaxVisionCostUsd } from "@/lib/platform/ai-usage/ai-usage.service";
import { analyzeImage, AIPolicyBlockedError, AIVisionFailedError } from "@/lib/platform/ai/ai.service";
import { getServerConfig, getConfiguredVisionProviders, isAnyVisionProviderConfigured } from "@/lib/config/server";
import { withRequestIdAndTiming } from "@/lib/observability";

const MAX_IMAGE_URL_LENGTH = 2048;
const MAX_BODY_BYTES = 100_000;
const ROUTE_KEY = "POST /api/v1/ai/analyze-image";

function withLegacyHeaders(res: NextResponse): NextResponse {
  setLegacyApiHeaders(res.headers);
  return res;
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

function logAiEvent(payload: {
  status: "success" | "failure";
  duration_ms: number;
  trace_id?: string;
  tenant_id?: string | null;
  stage?: string;
  risk_level?: string;
  completion_percent?: number;
  issues_count?: number;
  error?: string;
  http_status?: number;
}) {
  if (getServerConfig().NODE_ENV === "test") return;
  console.log(
    JSON.stringify({
      event: "ai_analyze_image",
      ...payload,
      ts: new Date().toISOString(),
    })
  );
}

export async function POST(request: Request) {
  const start = Date.now();
  const wrap = (res: NextResponse, tenantId?: string | null, userId?: string | null) =>
    withRequestIdAndTiming(request, withLegacyHeaders(res), { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start, tenantId, userId });

  if (!isAnyVisionProviderConfigured()) {
    return wrap(NextResponse.json({ error: "No AI vision provider is configured" }, { status: 503 }));
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength !== null && contentLength !== "" && Number(contentLength) > MAX_BODY_BYTES) {
    return wrap(NextResponse.json({ error: "Request body too large" }, { status: 413 }));
  }

  let body: { media_id?: string; image_url?: string; project_id?: string };
  try {
    body = await request.json();
  } catch {
    return wrap(NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }));
  }

  const imageUrl = typeof body.image_url === "string" ? body.image_url.trim() : "";
  if (!imageUrl) {
    return wrap(NextResponse.json({ error: "image_url is required" }, { status: 400 }));
  }

  const urlCheck = validateImageUrl(imageUrl);
  if (!urlCheck.ok) {
    return wrap(NextResponse.json({ error: urlCheck.error }, { status: 400 }));
  }

  const tenantCtx = await getTenantContextFromRequest(request);
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
        return wrap(NextResponse.json({ error: result.message }, { status: 429 }), tenantCtx.tenantId, tenantCtx.userId);
      }
    } catch {
      /* allow on rate-limit check failure (e.g. table missing) */
    }
    if (tenantCtx.tenantId) {
      const tier = tenantCtx.subscriptionTier ?? "free";
      const estimatedCost = estimateMaxVisionCostUsd(getConfiguredVisionProviders(), tier);
      const quotaMsg = await checkQuota(admin, tenantCtx.tenantId, estimatedCost);
      if (quotaMsg) {
        return wrap(NextResponse.json({ error: quotaMsg, code: "ai_budget_exceeded" }, { status: 402 }), tenantCtx.tenantId, tenantCtx.userId);
      }
      await checkBudgetAlert(admin, tenantCtx.tenantId, estimatedCost);
    }
  }

  if (!admin) {
    return wrap(NextResponse.json({ error: "No AI vision provider is configured" }, { status: 503 }), tenantCtx.tenantId, tenantCtx.userId);
  }

  try {
    const result = await analyzeImage(admin, {
      tenantId: tenantCtx.tenantId ?? null,
      userId: tenantCtx.userId ?? null,
      subscriptionTier: tenantCtx.subscriptionTier ?? "free",
      traceId: tenantCtx.traceId ?? null,
    }, {
      imageUrl,
      projectId: body.project_id ?? null,
      mediaId: body.media_id ?? null,
    });

    const durationMs = Date.now() - start;
    logAiEvent({
      status: "success",
      duration_ms: durationMs,
      trace_id: tenantCtx.traceId ?? undefined,
      tenant_id: tenantCtx.tenantId ?? undefined,
      stage: result.stage,
      risk_level: result.risk_level,
      completion_percent: result.completion_percent,
      issues_count: result.detected_issues.length,
    });
    const response = NextResponse.json(result);
    response.headers.set("X-AI-Duration-Ms", String(durationMs));
    return wrap(response, tenantCtx.tenantId, tenantCtx.userId);
  } catch (err) {
    const durationMs = Date.now() - start;
    if (err instanceof AIPolicyBlockedError) {
      logAiEvent({
        status: "failure",
        duration_ms: durationMs,
        trace_id: tenantCtx.traceId ?? undefined,
        tenant_id: tenantCtx.tenantId ?? undefined,
        error: err.message,
        http_status: 403,
      });
      return wrap(NextResponse.json({ error: err.message, code: "ai_policy_denied" }, { status: 403 }), tenantCtx.tenantId, tenantCtx.userId);
    }
    if (err instanceof AIVisionFailedError) {
      const isTimeout = err.message.toLowerCase().includes("timeout");
      logAiEvent({
        status: "failure",
        duration_ms: durationMs,
        trace_id: tenantCtx.traceId ?? undefined,
        tenant_id: tenantCtx.tenantId ?? undefined,
        error: err.message,
        http_status: isTimeout ? 504 : 502,
      });
      return wrap(NextResponse.json({ error: err.message }, { status: isTimeout ? 504 : 502 }), tenantCtx.tenantId, tenantCtx.userId);
    }
    const message = err instanceof Error ? err.message : "Analysis failed";
    logAiEvent({
      status: "failure",
      duration_ms: durationMs,
      trace_id: tenantCtx.traceId ?? undefined,
      tenant_id: tenantCtx.tenantId ?? undefined,
      error: message,
      http_status: 500,
    });
    return wrap(NextResponse.json({ error: message }, { status: 500 }), tenantCtx.tenantId, tenantCtx.userId);
  }
}
