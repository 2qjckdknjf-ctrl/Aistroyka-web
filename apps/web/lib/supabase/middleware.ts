import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicEnv, hasSupabaseEnv } from "@/lib/env";

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> };

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  if (!hasSupabaseEnv()) {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
