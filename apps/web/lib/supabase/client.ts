import { createBrowserClient } from "@supabase/ssr";
import { getPublicEnv, hasSupabaseEnv } from "@/lib/env";

const ENV_MESSAGE =
  "Missing Supabase env: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (in .env.local, .dev.vars, or Cloudflare Workers dashboard → Settings → Variables).";

export function createClient() {
  if (!hasSupabaseEnv()) {
    throw new Error(ENV_MESSAGE);
  }
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getPublicEnv();
  return createBrowserClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
