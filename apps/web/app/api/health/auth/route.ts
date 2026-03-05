/**
 * Minimal auth health check: public env present and auth usable.
 * GET /api/health/auth → { hasSupabaseEnv, authConfigured }.
 * Gated in production unless ENABLE_DIAG_ROUTES=true.
 */

import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/env";
import { isDiagEnabled } from "@/lib/config/diag";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  if (!isDiagEnabled()) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  const hasSupabaseEnvValue = hasSupabaseEnv();
  return NextResponse.json({
    hasSupabaseEnv: hasSupabaseEnvValue,
    authConfigured: hasSupabaseEnvValue,
  });
}
