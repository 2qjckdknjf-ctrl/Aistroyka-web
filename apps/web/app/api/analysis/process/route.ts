import { NextResponse } from "next/server";
import {
  getTenantContextFromRequest,
  requireTenant,
  TenantRequiredError,
} from "@/lib/tenant";
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
 * Process one analysis job for the caller's tenant (dequeue → AI → complete).
 * Call this after upload or from polling so the web app can run the engine without a separate worker.
 * Requires AI_ANALYSIS_URL and SUPABASE_SERVICE_ROLE_KEY in env. Authenticated tenant required.
 * Uses service_role for job RPCs so RLS/EXECUTE revokes on anon/authenticated do not break this route.
 * Jobs are claimed only within the caller's tenant_id to prevent cross-tenant processing.
 */
export async function POST(request: Request) {
  const start = Date.now();
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      const status = e.message.includes("membership") ? 403 : 401;
      return withRequestIdAndTiming(
        request,
        legacy(NextResponse.json({ ok: false, error: e.message }, { status })),
        { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start }
      );
    }
    throw e;
  }

  const admin = getAdminClient();
  if (!admin) {
    return withRequestIdAndTiming(request, legacy(NextResponse.json(
      {
        ok: false,
        error: "Job processing requires SUPABASE_SERVICE_ROLE_KEY (server-only). Set in env and redeploy.",
      },
      { status: 503 }
    )), { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start, tenantId: ctx.tenantId, userId: ctx.userId });
  }

  const aiUrl = getServerConfig().AI_ANALYSIS_URL || undefined;
  const traceId = request.headers.get("x-request-id")?.trim() || undefined;
  const result = await processOneJob(admin, aiUrl, { traceId, tenantId: ctx.tenantId });

  if (!result.ok) {
    if (result.reason === "no_url") {
      return withRequestIdAndTiming(request, legacy(NextResponse.json(
        { ok: false, error: "AI_ANALYSIS_URL is not configured" },
        { status: 503 }
      )), { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start, tenantId: ctx.tenantId, userId: ctx.userId });
    }
    if (result.reason === "no_job") {
      return withRequestIdAndTiming(request, legacy(NextResponse.json({ ok: true, processed: false })), { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start, tenantId: ctx.tenantId, userId: ctx.userId });
    }
    return withRequestIdAndTiming(request, legacy(NextResponse.json(
      { ok: false, error: result.message ?? "Processing failed" },
      { status: 500 }
    )), { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start, tenantId: ctx.tenantId, userId: ctx.userId });
  }

  return withRequestIdAndTiming(request, legacy(NextResponse.json({
    ok: true,
    processed: true,
    jobId: result.jobId,
    status: result.status,
  })), { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start, tenantId: ctx.tenantId, userId: ctx.userId });
}
