/**
 * POST /api/auth/login — server login that sets session cookies.
 * Body: { email, password, traceId? }.
 * Response: { ok: true } or { ok: false, message: string }; on success, Set-Cookie with sb-*.
 * No password in logs. For Cloudflare/OpenNext: route handler guarantees Set-Cookie on response.
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseEnv, getPublicConfig } from "@/lib/config";
import { getOrCreateTraceId, logStructured } from "@/lib/observability";

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> };

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const traceId = getOrCreateTraceId(request);
  const startMs = Date.now();

  if (!hasSupabaseEnv()) {
    const { getServerConfig } = await import("@/lib/config/server");
    if (getServerConfig().NODE_ENV === "development") {
      console.error("[login] env missing", { traceId, step: "env_check", status: "error", code: "missing_env" });
    }
    return NextResponse.json(
      { ok: false, message: "Supabase env missing. Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY." },
      { status: 503 }
    );
  }

  let body: { email?: string; password?: string; traceId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON body." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const clientTraceId = typeof body.traceId === "string" ? body.traceId : traceId;

  if (!email || !password) {
    return NextResponse.json({ ok: false, message: "Email and password are required." }, { status: 400 });
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

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const { getServerConfig } = await import("@/lib/config/server");
    if (getServerConfig().NODE_ENV === "development") {
      console.error("[login] auth error", {
        traceId: clientTraceId,
        step: "signIn",
        status: "error",
        code: "auth",
        message: error.message,
      });
    }
    logStructured({ event: "auth_login", traceId, route: "/api/auth/login", status: 401, duration_ms: Date.now() - startMs, error_type: "auth" });
    return NextResponse.json(
      { ok: false, message: error.message },
      { status: 401 }
    );
  }

  const { getServerConfig } = await import("@/lib/config/server");
  if (getServerConfig().NODE_ENV === "development") {
    console.error("[login] signIn success", { traceId: clientTraceId, step: "signIn", status: "ok" });
  }

  logStructured({ event: "auth_login", traceId, route: "/api/auth/login", status: 200, duration_ms: Date.now() - startMs });
  const response = NextResponse.json({ ok: true });
  cookiesToSet.forEach((c) => {
    response.cookies.set(c.name, c.value, (c.options as Record<string, unknown>) ?? {});
  });
  return response;
}
