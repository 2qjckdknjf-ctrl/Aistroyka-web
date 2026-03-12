/**
 * GET /api/_debug/auth — dev/preview only (or when DEBUG_AUTH=true).
 * Returns: { hasCookies, cookieNames, hasSupabaseUser, userId?, traceId? }.
 * No tokens or secrets. For verifying session after login.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { hasSupabaseEnv, isDebugAuthAllowed } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const traceId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `t-${Date.now()}`;

  if (!isDebugAuthAllowed(request)) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const cookieStore = await cookies();
  const all = cookieStore.getAll();
  const cookieNames = all.map((c) => c.name);
  const hasCookies = cookieNames.length > 0;

  let hasSupabaseUser = false;
  let userId: string | undefined;

  if (hasSupabaseEnv()) {
    const { createClient, getSessionUser } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const user = await getSessionUser(supabase);
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
