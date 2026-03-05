import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getPublicEnv, hasSupabaseEnv } from "@/lib/env";

const ENV_MESSAGE =
  "Missing Supabase env: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (in .env.local, .dev.vars, or Cloudflare Workers dashboard → Settings → Variables).";

let instance: SupabaseClient | null = null;

/**
 * Singleton Supabase client for browser usage.
 */
export function getSupabaseBrowser(): SupabaseClient {
  if (!hasSupabaseEnv()) {
    throw new Error(ENV_MESSAGE);
  }
  if (!instance) {
    const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getPublicEnv();
    instance = createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY);
  }
  return instance;
}
