/**
 * GET /api/v1/ops/metrics?from=&to=&project_id=
 * Lightweight aggregated counts for cockpit dashboards. Tenant-scoped, read-only.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, TenantForbiddenError } from "@/lib/tenant";
import { getOpsMetrics } from "@/lib/ops/ops-metrics.repository";
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
  const metrics = await getOpsMetrics(supabase, ctx.tenantId!, { from, to, project_id: projectId });
  return withRequestIdAndTiming(request, NextResponse.json(metrics), { route: ROUTE_KEY, method: "GET", duration_ms: Date.now() - start, tenantId: ctx.tenantId, userId: ctx.userId });
}
