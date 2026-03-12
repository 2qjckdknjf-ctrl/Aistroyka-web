/**
 * GET /api/system/metrics — system/tenant metrics (counts).
 * Safe placeholders when data unavailable.
 */

import { NextResponse } from "next/server";
import { getSystemMetrics } from "@/lib/system/metrics.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
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
