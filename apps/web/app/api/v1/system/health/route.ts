/**
 * GET /api/system/health — system health with service checks.
 * Database, ai_brain, copilot, workflows, events, alerts.
 * Production: SYSTEM_API_KEY required; X-System-Key header required.
 * Non-production: unauthenticated when SYSTEM_API_KEY not set.
 */

import { NextResponse } from "next/server";
import { getSystemHealth } from "@/lib/system/health.service";
import { requireSystemRouteAuth } from "@/lib/system/system-route-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const authErr = requireSystemRouteAuth(request);
  if (authErr) return authErr;

  try {
    const result = await getSystemHealth();
    const statusCode = result.status === "ok" ? 200 : result.status === "degraded" ? 200 : 503;
    return NextResponse.json(result, { status: statusCode });
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        services: {
          database: "error",
          ai_brain: "error",
          copilot: "error",
          workflows: "error",
          events: "error",
          alerts: "error",
        },
      },
      { status: 503 }
    );
  }
}
