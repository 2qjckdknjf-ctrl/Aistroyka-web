/**
 * Public (build-time / client-safe) config.
 * NEXT_PUBLIC_* only. Use getPublicConfig() or hasSupabaseEnv(); no direct process.env elsewhere.
 */

export interface PublicConfig {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  NEXT_PUBLIC_APP_URL: string;
  NEXT_PUBLIC_BUILD_SHA: string;
  NEXT_PUBLIC_BUILD_TIME: string;
  /** Set in CI: "production" | "staging" | "" */
  NEXT_PUBLIC_APP_ENV: string;
}

/** Client-safe: never throws. Returns empty strings when env is missing (use hasSupabaseEnv() to check). */
export function getPublicConfig(): PublicConfig {
  const url = typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" ? process.env.NEXT_PUBLIC_SUPABASE_URL.trim() : "";
  const key = typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY : "";
  const appUrl =
    typeof process.env.NEXT_PUBLIC_APP_URL === "string" ? process.env.NEXT_PUBLIC_APP_URL.trim() : "";
  return {
    NEXT_PUBLIC_SUPABASE_URL: url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: key,
    NEXT_PUBLIC_APP_URL: appUrl ? appUrl.replace(/\/+$/, "") : "https://aistroyka.ai",
    NEXT_PUBLIC_BUILD_SHA: process.env.NEXT_PUBLIC_BUILD_SHA ?? "",
    NEXT_PUBLIC_BUILD_TIME: process.env.NEXT_PUBLIC_BUILD_TIME ?? "",
    NEXT_PUBLIC_APP_ENV: (process.env.NEXT_PUBLIC_APP_ENV ?? "").trim().toLowerCase(),
  };
}

export function hasSupabaseEnv(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return typeof url === "string" && url.length > 0 && typeof key === "string" && key.length > 0;
}

/** Build stamp (no throw). Safe to call without Supabase env. */
export function getBuildStamp(): { sha: string; buildTime: string } {
  return {
    sha: process.env.NEXT_PUBLIC_BUILD_SHA ?? "",
    buildTime: process.env.NEXT_PUBLIC_BUILD_TIME ?? "",
  };
}
