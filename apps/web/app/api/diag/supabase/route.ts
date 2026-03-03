/**
 * Lightweight Supabase connectivity check. No secrets in response.
 * GET /api/diag/supabase → { reachable: boolean, latencyMs: number, status?: number, error?: string }.
 * Uses HEAD request to Supabase project origin; does not call auth or DB.
 */

import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/env";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { reachable: false, latencyMs: 0, error: "missing_supabase_env" },
      { status: 200 }
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
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
