/**
 * Canonical app URL for redirects, auth redirectTo, etc.
 * Set NEXT_PUBLIC_APP_URL in production (e.g. https://aistroyka.ai).
 */

const raw = typeof process.env.NEXT_PUBLIC_APP_URL === "string"
  ? process.env.NEXT_PUBLIC_APP_URL.trim()
  : "";

/** Canonical base URL (no trailing slash). Defaults to https://aistroyka.ai when unset. */
export function getAppUrl(): string {
  if (raw.length > 0) {
    return raw.replace(/\/+$/, "");
  }
  return "https://aistroyka.ai";
}
