/**
 * GET /api/v1/ops/metrics?from=&to=&project_id=
 * Lightweight aggregated counts for cockpit dashboards. Tenant-scoped, read-only.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, TenantForbiddenError, LitePathForbiddenError } from "@/lib/tenant";
import { getOpsMetrics } from "@/lib/ops/ops-metrics.repository";
import { getAdminClient } from "@/lib/supabase/admin";
import { getBuildStamp } from "@/lib/config/public";
import { withRequestIdAndTiming } from "@/lib/observability";

export const dynamic = "force-dynamic";

const ROUTE_KEY = "GET /api/v1/ops/metrics";

export async function GET(request: Request) {
  const start = Date.now();
  let ctx: Awaited<ReturnType<typeof getTenantContextFromRequest>>;
  try {
    ctx = await getTenantContextFromRequest(request);
  } catch (e) {
    if (e instanceof TenantForbiddenError) {
      return withRequestIdAndTiming(request, NextResponse.json({ error: e.message }, { status: 403 }), { route: ROUTE_KEY, method: "GET", duration_ms: Date.now() - start });
    }
    throw e;
  }
  if (ctx.userId && !ctx.tenantId) {
    return withRequestIdAndTiming(request, NextResponse.json({ error: "User has no tenant membership" }, { status: 403 }), { route: ROUTE_KEY, method: "GET", duration_ms: Date.now() - start });
  }
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof LitePathForbiddenError) {
      return NextResponse.json(
        { error: "forbidden", code: "lite_client_path_forbidden" },
        { status: 403 }
      );
    }
    if (e instanceof TenantRequiredError) {
      return withRequestIdAndTiming(request, NextResponse.json({ error: e.message }, { status: 401 }), { route: ROUTE_KEY, method: "GET", duration_ms: Date.now() - start });
    }
    throw e;
  }

  const url = new URL(request.url);
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  const projectId = url.searchParams.get("project_id") ?? undefined;

  const supabase = await createClientFromRequest(request);
  const metrics = await getOpsMetrics(supabase, ctx.tenantId!, { from, to, project_id: projectId }, getAdminClient() ?? undefined);
  const stamp = getBuildStamp();
  return withRequestIdAndTiming(
    request,
    NextResponse.json({
      ...metrics,
      correlation: {
        build_sha: stamp.sha ? stamp.sha.slice(0, 7) : null,
        build_time: stamp.buildTime || null,
        app_env: process.env.NEXT_PUBLIC_APP_ENV ?? process.env.NODE_ENV ?? null,
      },
    }),
    { route: ROUTE_KEY, method: "GET", duration_ms: Date.now() - start, tenantId: ctx.tenantId, userId: ctx.userId }
  );
}
