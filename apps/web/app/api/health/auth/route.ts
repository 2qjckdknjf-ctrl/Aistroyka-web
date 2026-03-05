/**
 * Minimal auth health check: public env present and auth usable.
 * GET /api/health/auth → { hasSupabaseEnv, authConfigured }.
 * Gated by isDebugAuthAllowed (debug flag + host allowlist), consistent with /api/_debug/auth.
 */

import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/env";
import { isDebugAuthAllowed } from "@/lib/config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  if (!isDebugAuthAllowed(request)) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  const hasSupabaseEnvValue = hasSupabaseEnv();
  return NextResponse.json({
    hasSupabaseEnv: hasSupabaseEnvValue,
    authConfigured: hasSupabaseEnvValue,
  });
}
