import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, TenantForbiddenError } from "@/lib/tenant";
import { authorize } from "@/lib/tenant/tenant.policy";
import { getAdminClient } from "@/lib/supabase/admin";
import { getServerConfig } from "@/lib/config/server";
import { processOneJob } from "@/lib/ai/runOneJob";
import { withRequestIdAndTiming } from "@/lib/observability";
import { setLegacyApiHeaders } from "@/lib/api/deprecation-headers";

const ROUTE_KEY = "POST /api/analysis/process";

function legacy(res: NextResponse): NextResponse {
  setLegacyApiHeaders(res.headers);
  return res;
}

/**
 * Process one analysis job (dequeue → AI → complete).
 * Call this after upload or from polling so the web app can run the engine without a separate worker.
 * Requires AI_ANALYSIS_URL and SUPABASE_SERVICE_ROLE_KEY in env. Authenticated user required.
 * Uses service_role for job RPCs so RLS/EXECUTE revokes on anon/authenticated do not break this route.
 */
export async function POST(request: Request) {
  const start = Date.now();
  let ctx;
  try {
    ctx = await getTenantContextFromRequest(request);
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError || e instanceof TenantForbiddenError) {
      return legacy(NextResponse.json({ ok: false, error: e.message }, { status: e instanceof TenantForbiddenError ? 403 : 401 }));
    }
    throw e;
  }
  if (!authorize(ctx, "analysis:trigger")) {
    return legacy(NextResponse.json({ ok: false, error: "Insufficient rights" }, { status: 403 }));
  }
  const supabase = await createClientFromRequest(request);
  const user = { id: ctx.userId };

  const admin = getAdminClient();
  if (!admin) {
    return withRequestIdAndTiming(request, legacy(NextResponse.json(
      {
        ok: false,
        error: "Job processing requires SUPABASE_SERVICE_ROLE_KEY (server-only). Set in env and redeploy.",
      },
      { status: 503 }
    )), { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start, userId: user.id });
  }

  const aiUrl = getServerConfig().AI_ANALYSIS_URL || undefined;
  const traceId = request.headers.get("x-request-id")?.trim() || undefined;
  const aiRequestHeaders = new Headers();
  if (aiUrl) {
    const target = new URL(aiUrl);
    const sourceOrigin = new URL(request.url).origin;
    const productionOrigins = new Set(["https://aistroyka.ai", "https://www.aistroyka.ai"]);
    const trustedOrigin = target.origin === sourceOrigin ||
      (productionOrigins.has(target.origin) && productionOrigins.has(sourceOrigin));
    if (trustedOrigin &&
        ["/api/v1/ai/analyze-image", "/api/ai/analyze-image"].includes(target.pathname)) {
      for (const name of ["authorization", "cookie"]) {
        const value = request.headers.get(name);
        if (value) aiRequestHeaders.set(name, value);
      }
    }
  }
  const result = await processOneJob(admin, aiUrl, { traceId,
    tenantId: ctx.tenantId, callerClient: supabase, aiRequestHeaders });

  if (!result.ok) {
    if (result.reason === "no_url") {
      return withRequestIdAndTiming(request, legacy(NextResponse.json(
        { ok: false, error: "AI_ANALYSIS_URL is not configured" },
        { status: 503 }
      )), { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start, userId: user.id });
    }
    if (result.reason === "no_job") {
      return withRequestIdAndTiming(request, legacy(NextResponse.json({ ok: true, processed: false })), { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start, userId: user.id });
    }
    return withRequestIdAndTiming(request, legacy(NextResponse.json(
      { ok: false, error: result.message ?? "Processing failed" },
      { status: 500 }
    )), { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start, userId: user.id });
  }

  return withRequestIdAndTiming(request, legacy(NextResponse.json({
    ok: true,
    processed: true,
    jobId: result.jobId,
    status: result.status,
  })), { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start, userId: user.id });
}
