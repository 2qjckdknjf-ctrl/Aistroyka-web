import { NextResponse } from "next/server";

/**
 * Health check for load balancers and monitoring. No external calls.
 * Includes requestHost and appUrl for domain/redirect verification (no secrets).
 */
export async function GET(request: Request) {
  const requestHost = request.headers.get("host") ?? null;
  const appUrl =
    typeof process.env.NEXT_PUBLIC_APP_URL === "string" && process.env.NEXT_PUBLIC_APP_URL.trim().length > 0
      ? process.env.NEXT_PUBLIC_APP_URL.trim()
      : null;

  return NextResponse.json({
    ok: true,
    ts: new Date().toISOString(),
    requestHost,
    appUrl,
  });
}
