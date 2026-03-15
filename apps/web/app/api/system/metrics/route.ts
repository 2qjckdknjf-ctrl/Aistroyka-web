/**
 * GET /api/system/metrics — system/tenant metrics (counts).
 * Safe placeholders when data unavailable.
 * Production: SYSTEM_API_KEY required; X-System-Key header required.
 * Non-production: unauthenticated when SYSTEM_API_KEY not set.
 */

import { NextResponse } from "next/server";
import { getSystemMetrics } from "@/lib/system/metrics.service";
import { requireSystemRouteAuth } from "@/lib/system/system-route-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const authErr = requireSystemRouteAuth(request);
  if (authErr) return authErr;

  try {
    const tenantId = request.headers.get("x-tenant-id")?.trim() ?? undefined;
    const result = await getSystemMetrics({ tenantId: tenantId ?? null });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      {
        projects_count: null,
        tasks_count: null,
        reports_count: null,
        alerts_count: null,
        ai_signals_count: null,
        _meta: { source: "placeholder", at: new Date().toISOString() },
      },
      { status: 200 }
    );
  }
}
