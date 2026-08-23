/**
 * POST /api/auth/forgot-password — request a password reset email.
 * Body: { email, locale? }.
 * Always returns { ok: true } on valid email shape to avoid account enumeration.
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseEnv } from "@/lib/config";
import { getOrCreateTraceId, logStructured } from "@/lib/observability";
import { getAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/platform/rate-limit/rate-limit.service";
import { buildPasswordRecoveryRedirectUrl, isAuthLocale } from "@/lib/auth/password-recovery";
import { getRequestClientIp } from "@/lib/platform-owner/client-ip";

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> };

export const dynamic = "force-dynamic";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const traceId = getOrCreateTraceId(request);
  const startMs = Date.now();

  const admin = getAdminClient();
  if (admin) {
    try {
      const ip = getRequestClientIp(request) ?? "unknown";
      const result = await checkRateLimit(admin, { tenantId: null, ip, endpoint: "/api/auth/forgot-password" });
      if (result.limited) {
        return NextResponse.json({ ok: false, message: result.message }, { status: 429 });
      }
    } catch {
      logStructured({ event: "rate_limit_unavailable", endpoint: "/api/auth/forgot-password", tenant_id: null, request_id: traceId });
    }
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json({ ok: false, message: "Supabase env missing." }, { status: 503 });
  }

  let body: { email?: string; locale?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON body." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const locale = typeof body.locale === "string" && isAuthLocale(body.locale) ? body.locale : "en";

  if (!email || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ ok: false, message: "A valid email is required." }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const redirectTo = buildPasswordRecoveryRedirectUrl(origin, locale);

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

  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) {
    logStructured({
      event: "auth_forgot_password",
      traceId,
      route: "/api/auth/forgot-password",
      status: 500,
      duration_ms: Date.now() - startMs,
      error_type: "supabase",
    });
    return NextResponse.json({ ok: false, message: "Unable to send reset email. Please try again later." }, { status: 500 });
  }

  logStructured({
    event: "auth_forgot_password",
    traceId,
    route: "/api/auth/forgot-password",
    status: 200,
    duration_ms: Date.now() - startMs,
  });

  const response = NextResponse.json({ ok: true });
  cookiesToSet.forEach((c) => {
    response.cookies.set(c.name, c.value, (c.options as Record<string, unknown>) ?? {});
  });
  return response;
}
