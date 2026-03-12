import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicEnv, hasSupabaseEnv } from "@/lib/env";

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> };

function envMissingMessage(): string {
  const missing: string[] = [];
  if (typeof process.env.NEXT_PUBLIC_SUPABASE_URL !== "string" || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }
  if (typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== "string" || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return missing.length
    ? `Supabase env missing: ${missing.join(", ")}. Set in .env.local or Cloudflare build env.`
    : "Supabase env missing.";
}

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  if (!hasSupabaseEnv()) {
    const isDevOrPreview =
      process.env.NODE_ENV === "development" || process.env.VERCEL_ENV === "preview";
    if (isDevOrPreview) {
      return {
        response: new NextResponse(envMissingMessage(), {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        }),
        user: null,
      };
    }
    if (process.env.NODE_ENV === "production") {
      console.error("[auth] updateSession: missing Supabase env in production");
    }
    return { response, user: null };
  }

  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getPublicEnv();

  const supabase = createServerClient(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            options != null
              ? response.cookies.set(name, value, options as Record<string, unknown>)
              : response.cookies.set(name, value)
          );
        },
      },
    }
  );

  let user: { id: string; email?: string } | null = null;
  try {
    const res = await supabase.auth.getUser();
    user = res?.data?.user ?? null;
  } catch {
    // getUser() can throw in Edge or when auth server fails; do not crash middleware
  }

  return { response, user };
}
