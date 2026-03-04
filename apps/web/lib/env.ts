/**
 * Runtime env validation for public Supabase vars.
 * Delegates to @/lib/config. Use getPublicConfig() or hasSupabaseEnv() from @/lib/config elsewhere.
 * @deprecated Prefer importing from @/lib/config (getPublicConfig, hasSupabaseEnv).
 */

import { getPublicConfig, hasSupabaseEnv as hasSupabaseEnvFromConfig } from "@/lib/config";
import { getServerConfig } from "@/lib/config/server";

export type { PublicConfig } from "@/lib/config/public";

export interface PublicEnv {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
}

const message =
  "Missing Supabase env: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (in .env.local, .dev.vars for local Wrangler, or Cloudflare Workers dashboard).";

export function getPublicEnv(): PublicEnv {
  const c = getPublicConfig();
  return {
    NEXT_PUBLIC_SUPABASE_URL: c.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: c.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

export function hasSupabaseEnv(): boolean {
  return hasSupabaseEnvFromConfig();
}

export function assertSupabasePublicEnv(): void {
  const c = getPublicConfig();
  if (!c.NEXT_PUBLIC_SUPABASE_URL || !c.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error(message);
  }
}

export function assertSupabaseServerEnv(): void {
  const key = getServerConfig().SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("Supabase server env missing: SUPABASE_SERVICE_ROLE_KEY.");
  }
}
