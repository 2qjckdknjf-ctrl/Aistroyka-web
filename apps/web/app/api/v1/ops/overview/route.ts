import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getOpsOverview } from "@/lib/ops/ops-overview.repository";
import { withRequestIdAndTiming } from "@/lib/observability";

export const dynamic = "force-dynamic";

const ROUTE_KEY = "GET /api/v1/ops/overview";

/**
 * GET /api/v1/ops/overview
 * Returns KPIs and "needs attention" queues for the operations cockpit.
 * Tenant-scoped; any tenant member can read.
 */
export async function GET(request: Request) {
  const start = Date.now();
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return withRequestIdAndTiming(request, NextResponse.json({ error: e.message }, { status: 401 }), { route: ROUTE_KEY, method: "GET", duration_ms: Date.now() - start });
    }
    throw e;
  }

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "10", 10) || 10, 20);
  const projectId = url.searchParams.get("project_id") ?? undefined;
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;

  const supabase = await createClient();
  const overview = await getOpsOverview(supabase, ctx.tenantId!, { limit, projectId, from, to });
  return withRequestIdAndTiming(request, NextResponse.json(overview), { route: ROUTE_KEY, method: "GET", duration_ms: Date.now() - start, tenantId: ctx.tenantId, userId: ctx.userId });
}
