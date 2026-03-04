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
}

const message =
  "Missing Supabase env: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (in .env.local or Cloudflare build env).";

export function getPublicConfig(): PublicConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (typeof url !== "string" || url.length === 0 || typeof key !== "string" || key.length === 0) {
    throw new Error(message);
  }
  const appUrl =
    typeof process.env.NEXT_PUBLIC_APP_URL === "string" ? process.env.NEXT_PUBLIC_APP_URL.trim() : "";
  return {
    NEXT_PUBLIC_SUPABASE_URL: url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: key,
    NEXT_PUBLIC_APP_URL: appUrl ? appUrl.replace(/\/+$/, "") : "https://aistroyka.ai",
    NEXT_PUBLIC_BUILD_SHA: process.env.NEXT_PUBLIC_BUILD_SHA ?? "",
    NEXT_PUBLIC_BUILD_TIME: process.env.NEXT_PUBLIC_BUILD_TIME ?? "",
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
