import { NextResponse } from "next/server";

/**
 * Health check for load balancers and monitoring. No external calls.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    ts: new Date().toISOString(),
  });
}
