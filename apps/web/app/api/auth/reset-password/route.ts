/**
 * POST /api/auth/reset-password — set a new password after recovery session is established.
 * Body: { password, confirmPassword }.
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseEnv } from "@/lib/config";
import { getOrCreateTraceId, logStructured } from "@/lib/observability";
import { validateNewPassword } from "@/lib/auth/password-recovery";

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> };

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const traceId = getOrCreateTraceId(request);
  const startMs = Date.now();

  if (!hasSupabaseEnv()) {
    return NextResponse.json({ ok: false, message: "Supabase env missing." }, { status: 503 });
  }

  let body: { password?: string; confirmPassword?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON body." }, { status: 400 });
  }

  const password = typeof body.password === "string" ? body.password : "";
  const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : "";
  const validationError = validateNewPassword(password, confirmPassword);
  if (validationError === "too_short") {
    return NextResponse.json({ ok: false, message: "Password must be at least 8 characters." }, { status: 400 });
  }
  if (validationError === "mismatch") {
    return NextResponse.json({ ok: false, message: "Passwords do not match." }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const cookiesToSet: CookieToSet[] = [];
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookies: CookieToSet[]) {
        cookies.forEach((c) => cookiesToSet.push(c));
      },
    },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ ok: false, message: "Invalid or expired reset link." }, { status: 401 });
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    logStructured({
      event: "auth_reset_password",
      traceId,
      route: "/api/auth/reset-password",
      status: 400,
      duration_ms: Date.now() - startMs,
      error_type: "supabase",
    });
    return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
  }

  await supabase.auth.signOut();

  logStructured({
    event: "auth_reset_password",
    traceId,
    route: "/api/auth/reset-password",
    status: 200,
    duration_ms: Date.now() - startMs,
  });

  const response = NextResponse.json({ ok: true });
  cookiesToSet.forEach((c) => {
    response.cookies.set(c.name, c.value, (c.options as Record<string, unknown>) ?? {});
  });
  return response;
}
