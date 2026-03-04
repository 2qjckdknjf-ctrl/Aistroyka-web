/**
 * GET /api/_debug/auth — dev/preview only (or when DEBUG_AUTH=true).
 * Returns: { hasCookies, cookieNames, hasSupabaseUser, userId?, traceId? }.
 * No tokens or secrets. For verifying session after login.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { hasSupabaseEnv, getPublicConfig, isDebugAuthAllowed } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const traceId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `t-${Date.now()}`;

  if (!isDebugAuthAllowed()) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const cookieStore = await cookies();
  const all = cookieStore.getAll();
  const cookieNames = all.map((c) => c.name);
  const hasCookies = cookieNames.length > 0;

  let hasSupabaseUser = false;
  let userId: string | undefined;

  if (hasSupabaseEnv()) {
    const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: key } = getPublicConfig();
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // read-only debug: do not set cookies
        },
      },
    });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    hasSupabaseUser = !!user;
    if (user?.id) userId = user.id;
  }

  return NextResponse.json({
    hasCookies,
    cookieNames,
    hasSupabaseUser,
    userId,
    traceId,
  });
}
