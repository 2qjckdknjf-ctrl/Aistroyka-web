/**
 * Minimal auth health check: public env present and auth usable.
 * GET /api/health/auth → { hasSupabaseEnv, authConfigured }.
 * No secrets. For smoke tests and deploy checks.
 */

import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/env";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const hasSupabaseEnvValue = hasSupabaseEnv();
  return NextResponse.json({
    hasSupabaseEnv: hasSupabaseEnvValue,
    authConfigured: hasSupabaseEnvValue,
  });
}
