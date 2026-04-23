/**
 * Lightweight Supabase connectivity check. No secrets in response.
 * GET /api/diag/supabase → { reachable: boolean, latencyMs: number, status?: number, error?: string }.
 * Uses HEAD request to Supabase project origin; does not call auth or DB.
 */

import { NextResponse } from "next/server";
import { hasSupabaseEnv, getPublicConfig, isDebugDiagAllowed } from "@/lib/config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  if (!isDebugDiagAllowed(request)) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { reachable: false, latencyMs: 0, error: "missing_supabase_env" },
      { status: 200 }
    );
  }

  const { NEXT_PUBLIC_SUPABASE_URL: url } = getPublicConfig();
  let origin: string;
  try {
    origin = new URL(url).origin;
  } catch {
    return NextResponse.json(
      { reachable: false, latencyMs: 0, error: "invalid_url" },
      { status: 200 }
    );
  }

  const start = Date.now();
  try {
    const res = await fetch(origin + "/", {
      method: "HEAD",
      signal: AbortSignal.timeout(10_000),
    });
    const latencyMs = Date.now() - start;
    const reachable = res.ok || res.status < 500;
    return NextResponse.json({ reachable, latencyMs, status: res.status });
  } catch (err) {
    const latencyMs = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      reachable: false,
      latencyMs,
      error: message.includes("timeout") ? "timeout" : "fetch_error",
    });
  }
}
