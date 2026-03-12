/**
 * GET /api/system/health — system health with service checks.
 * Database, ai_brain, copilot, workflows, events, alerts.
 */

import { NextResponse } from "next/server";
import { getSystemHealth } from "@/lib/system/health.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
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
