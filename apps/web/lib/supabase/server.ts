import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicEnv } from "@/lib/env";

export type CookieToSet = { name: string; value: string; options?: Record<string, unknown> };

/** Thrown when request sends a service_role JWT; API must return 403. */
export class ServiceRoleForbiddenError extends Error {
  constructor() {
    super("Service role JWT not allowed");
    this.name = "ServiceRoleForbiddenError";
  }
}

/** Decode JWT payload without verification (used only to read role). */
function decodeJwtPayload(token: string): { role?: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const raw = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = typeof atob !== "undefined" ? atob(raw) : Buffer.from(raw, "base64").toString("utf8");
    return JSON.parse(json) as { role?: string };
  } catch {
    return null;
  }
}

/**
 * Create Supabase client for API routes. When request has Authorization: Bearer <token>,
 * uses that JWT so tenant/auth work without cookies (e.g. smoke scripts, CLI).
 * Rejects service_role JWT with ServiceRoleForbiddenError (caller should return 403).
 */
export async function createClientFromRequest(request: Request) {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getPublicEnv();
  const authz = request.headers.get("Authorization")?.trim();
  const token = authz?.startsWith("Bearer ") ? authz.slice(7).trim() : null;
  if (token) {
    const payload = decodeJwtPayload(token);
    if (payload?.role === "service_role") throw new ServiceRoleForbiddenError();
    return createSupabaseClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    });
  }
  return createClient();
}

/**
 * Get current user from Supabase auth without throwing.
 * Use in Server Components/layouts/API to avoid crashes when getUser() fails or returns null data.
 */
export async function getSessionUser(supabase: SupabaseClient): Promise<{ id: string; email?: string } | null> {
  try {
    const res = await supabase.auth.getUser();
    const user = res?.data?.user ?? null;
    return user ? { id: user.id, email: user.email ?? undefined } : null;
  } catch {
    return null;
  }
}

/**
 * Get current session from Supabase auth without throwing.
 * Use when only session/token is needed (e.g. API calls that need access_token).
 */
export async function safeGetSession(
  supabase: SupabaseClient
): Promise<{ access_token: string; user: { id: string; email?: string } } | null> {
  try {
    const res = await supabase.auth.getSession();
    const session = res?.data?.session ?? null;
    if (!session?.access_token || !session?.user?.id) return null;
    return {
      access_token: session.access_token,
      user: { id: session.user.id, email: session.user.email ?? undefined },
    };
  } catch {
    return null;
  }
}

export async function createClient() {
  const cookieStore = await cookies();
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getPublicEnv();

  return createServerClient(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as any)
            );
          } catch {
            // ignore in Server Components
          }
        },
      },
    }
  );
}
