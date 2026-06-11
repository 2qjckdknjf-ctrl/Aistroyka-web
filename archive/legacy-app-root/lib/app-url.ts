/**
 * Canonical app URL for redirects, auth redirectTo, etc.
 * Set NEXT_PUBLIC_APP_URL in production (e.g. https://www.aistroyka.ai).
 * Not used for domain redirects; those are handled by Vercel Domains only.
 */

const raw = typeof process.env.NEXT_PUBLIC_APP_URL === "string"
  ? process.env.NEXT_PUBLIC_APP_URL.trim()
  : "";

/** Canonical base URL (no trailing slash). Defaults to https://www.aistroyka.ai when unset. */
export function getAppUrl(): string {
  if (raw.length > 0) {
    return raw.replace(/\/+$/, "");
  }
  return "https://www.aistroyka.ai";
}
