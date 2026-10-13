/**
 * GET /api/v1/health — canonical v1 health. Same logic as GET /api/health. Response validated by contract.
 */

import { NextResponse } from "next/server";
import { getHealthResponse } from "@/lib/controllers/health";
import { HealthResponseSchema } from "@aistroyka/contracts";
import { getServerConfig } from "@/lib/config/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
const HEALTH_HEADERS = { "Cache-Control": "no-store, max-age=0, must-revalidate", "CDN-Cache-Control": "no-store", "Cloudflare-CDN-Cache-Control": "no-store" };

export async function GET() {
  try {
    let body: Record<string, unknown>;
    let status: number;
    try {
      const result = await getHealthResponse();
      body = result.body;
      status = result.status;
    } catch (err) {
      if (process.env.NODE_ENV !== "test") {
        console.error("[v1/health] getHealthResponse threw", err instanceof Error ? err.message : String(err));
      }
      body = { ok: false, db: "error", aiConfigured: false, openaiConfigured: false, reason: "health_check_error" };
      status = 503;
    }
    const parsed = HealthResponseSchema.safeParse(body);
    if (!parsed.success) {
      if (process.env.NODE_ENV !== "test") {
        console.error("[v1/health] response contract validation failed", parsed.error.flatten());
      }
      return NextResponse.json(
        { ok: false, db: "error", aiConfigured: false, openaiConfigured: false, reason: "validation_failed" },
        { status: 503, headers: HEALTH_HEADERS }
      );
    }
    return NextResponse.json(parsed.data, { status, headers: HEALTH_HEADERS });
  } catch (outerErr) {
    return NextResponse.json(
      { ok: false, db: "error", aiConfigured: false, openaiConfigured: false, reason: "health_check_error" },
      { status: 503, headers: HEALTH_HEADERS }
    );
  }
}
