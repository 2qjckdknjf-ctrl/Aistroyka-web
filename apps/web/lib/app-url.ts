/**
 * Canonical app URL for redirects, auth redirectTo, etc.
 * Set NEXT_PUBLIC_APP_URL in production (e.g. https://aistroyka.ai).
 * Uses centralized config (lib/config/public).
 */

import { hasSupabaseEnv, getPublicConfig } from "@/lib/config";

/** Canonical base URL (no trailing slash). Defaults to https://aistroyka.ai when unset. */
export function getAppUrl(): string {
  if (!hasSupabaseEnv()) return "https://aistroyka.ai";
  return getPublicConfig().NEXT_PUBLIC_APP_URL;
}
