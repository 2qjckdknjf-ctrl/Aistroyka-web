/**
 * Runtime env validation for public Supabase vars.
 * Use getPublicEnv() everywhere instead of process.env for these vars.
 * Throws a clear error if required vars are missing.
 *
 * Where vars come from:
 * - Local: .env.local (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
 * - Cloudflare: set at build time (e.g. Pages → Settings → Environment variables for Production/Preview),
 *   so they are inlined into the client bundle; runtime Worker env is not available to NEXT_PUBLIC_*.
 */

export interface PublicEnv {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
}

const message =
  "Missing Supabase env: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (in .env.local, .dev.vars for local Wrangler, or Cloudflare Workers dashboard → Settings → Variables).";

/**
 * Returns public env vars. Throws if either is missing or empty.
 */
export function getPublicEnv(): PublicEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (typeof url !== "string" || url.length === 0 || typeof key !== "string" || key.length === 0) {
    throw new Error(message);
  }
  return { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: key };
}

/**
 * Minimal env check without throwing. Use in dev/smoke only.
 */
export function hasSupabaseEnv(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return typeof url === "string" && url.length > 0 && typeof key === "string" && key.length > 0;
}

/**
 * Throws with a clear message if public Supabase env is missing.
 * Use when the app must have auth (e.g. login page, middleware).
 */
export function assertSupabasePublicEnv(): void {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const missing: string[] = [];
  if (typeof url !== "string" || url.length === 0) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (typeof key !== "string" || key.length === 0) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (missing.length > 0) {
    throw new Error(`Supabase env missing: ${missing.join(", ")}. Set in .env.local or Cloudflare build env.`);
  }
}

/**
 * Optional: throw if server-side service role is required and missing.
 * Use only in server code that needs SUPABASE_SERVICE_ROLE_KEY.
 */
export function assertSupabaseServerEnv(): void {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (typeof key !== "string" || key.length === 0) {
    throw new Error("Supabase server env missing: SUPABASE_SERVICE_ROLE_KEY.");
  }
}
