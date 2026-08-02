/**
 * Shared HTTP handler for analysis job processing (v1 + legacy).
 * Tenant comes only from server-derived TenantContext; uses tenant-scoped processOneJob.
 */

import { NextResponse } from "next/server";
import {
  getTenantContextFromRequest,
  requireTenant,
  authorize,
  TenantRequiredError,
  TenantForbiddenError,
  type ClientProfile,
} from "@/lib/tenant";
import { getAdminClient } from "@/lib/supabase/admin";
import { getServerConfig } from "@/lib/config/server";
import { processOneJob } from "@/lib/ai/runOneJob";
import { checkRateLimit } from "@/lib/platform/rate-limit/rate-limit.service";
import { getOrCreateRequestId, logStructured, withRequestIdAndTiming } from "@/lib/observability";
import { setLegacyApiHeaders } from "@/lib/api/deprecation-headers";

const LITE_CLIENTS = new Set<ClientProfile>([
  "ios_lite",
  "android_lite",
  "ios_worker",
  "android_worker",
]);

export type AnalysisProcessHttpOptions = {
  /** Telemetry / observability route label matching the actual URL. */
  routeKey: string;
  /** Rate-limit endpoint key (includes path). */
  rateLimitEndpoint: string;
  /** When true, attach legacy deprecation headers. */
  legacy: boolean;
};

function wrap(res: NextResponse, legacy: boolean): NextResponse {
  if (legacy) setLegacyApiHeaders(res.headers);
  return res;
}

/**
 * Canonical analysis process POST. Direct call of this function always enforces
 * tenant context, analysis:trigger, lite denial, and tenant-scoped processing.
 */
export async function handleAnalysisProcessPost(
  request: Request,
  options: AnalysisProcessHttpOptions
): Promise<Response> {
  const start = Date.now();
  const { routeKey, rateLimitEndpoint, legacy } = options;
  const timingBase = { route: routeKey, method: "POST" as const };

  let ctx: Awaited<ReturnType<typeof getTenantContextFromRequest>>;
  try {
    ctx = await getTenantContextFromRequest(request);
  } catch (e) {
    if (e instanceof TenantForbiddenError) {
      return withRequestIdAndTiming(
        request,
        wrap(NextResponse.json({ ok: false, error: e.message }, { status: 403 }), legacy),
        { ...timingBase, duration_ms: Date.now() - start }
      );
    }
    throw e;
  }

  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      const status = e.message.includes("membership") ? 403 : 401;
      return withRequestIdAndTiming(
        request,
        wrap(NextResponse.json({ ok: false, error: e.message }, { status }), legacy),
        { ...timingBase, duration_ms: Date.now() - start, userId: ctx.userId }
      );
    }
    throw e;
  }

  if (LITE_CLIENTS.has(ctx.clientProfile)) {
    return withRequestIdAndTiming(
      request,
      wrap(
        NextResponse.json(
          { ok: false, error: "forbidden", code: "lite_client_path_forbidden" },
          { status: 403 }
        ),
        legacy
      ),
      {
        ...timingBase,
        duration_ms: Date.now() - start,
        tenantId: ctx.tenantId,
        userId: ctx.userId,
      }
    );
  }

  if (!authorize(ctx, "analysis:trigger")) {
    return withRequestIdAndTiming(
      request,
      wrap(
        NextResponse.json(
          { ok: false, error: "Insufficient rights: member or above required" },
          { status: 403 }
        ),
        legacy
      ),
      {
        ...timingBase,
        duration_ms: Date.now() - start,
        tenantId: ctx.tenantId,
        userId: ctx.userId,
      }
    );
  }

  const admin = getAdminClient();
  if (admin) {
    try {
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        request.headers.get("x-real-ip") ??
        "unknown";
      const result = await checkRateLimit(admin, {
        tenantId: ctx.tenantId,
        ip,
        endpoint: rateLimitEndpoint,
      });
      if (result.limited) {
        return withRequestIdAndTiming(
          request,
          wrap(NextResponse.json({ ok: false, error: result.message }, { status: 429 }), legacy),
          {
            ...timingBase,
            duration_ms: Date.now() - start,
            tenantId: ctx.tenantId,
            userId: ctx.userId,
          }
        );
      }
    } catch {
      // Match jobs/process high-risk policy: log and continue; never fall back to global dequeue.
      logStructured({
        event: "rate_limit_unavailable",
        endpoint: rateLimitEndpoint,
        tenant_id: ctx.tenantId,
        request_id: getOrCreateRequestId(request),
      });
    }
  }

  if (!admin) {
    return withRequestIdAndTiming(
      request,
      wrap(
        NextResponse.json(
          {
            ok: false,
            error:
              "Job processing requires SUPABASE_SERVICE_ROLE_KEY (server-only). Set in env and redeploy.",
          },
          { status: 503 }
        ),
        legacy
      ),
      {
        ...timingBase,
        duration_ms: Date.now() - start,
        tenantId: ctx.tenantId,
        userId: ctx.userId,
      }
    );
  }

  const aiUrl = getServerConfig().AI_ANALYSIS_URL || undefined;
  const traceId = request.headers.get("x-request-id")?.trim() || undefined;
  const result = await processOneJob(admin, aiUrl, {
    tenantId: ctx.tenantId,
    traceId,
  });

  const obs = {
    ...timingBase,
    duration_ms: Date.now() - start,
    tenantId: ctx.tenantId,
    userId: ctx.userId,
  };

  if (!result.ok) {
    if (result.reason === "no_url") {
      return withRequestIdAndTiming(
        request,
        wrap(
          NextResponse.json(
            { ok: false, error: "AI_ANALYSIS_URL is not configured" },
            { status: 503 }
          ),
          legacy
        ),
        obs
      );
    }
    if (result.reason === "no_job") {
      return withRequestIdAndTiming(
        request,
        wrap(NextResponse.json({ ok: true, processed: false }), legacy),
        obs
      );
    }
    return withRequestIdAndTiming(
      request,
      wrap(NextResponse.json({ ok: false, error: "Processing failed" }, { status: 500 }), legacy),
      obs
    );
  }

  return withRequestIdAndTiming(
    request,
    wrap(
      NextResponse.json({
        ok: true,
        processed: true,
        jobId: result.jobId,
        status: result.status,
      }),
      legacy
    ),
    obs
  );
}
