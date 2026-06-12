import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getPublicEnv } from "@/lib/env";

/**
 * Creates a Supabase client for server-side usage (RSC, Route Handlers).
 *
 * TODO (Next.js App Router): Add cookie-based session handling so this client
 * uses the user's session for auth. For now, this is an unauthenticated client.
 */
export function createSupabaseServerClient(): SupabaseClient {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getPublicEnv();
  return createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
