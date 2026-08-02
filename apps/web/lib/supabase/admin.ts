/**
 * Server-only Supabase client with service role.
 * Use only in API routes or server code. Never expose to the client.
 * If SUPABASE_SERVICE_ROLE_KEY is not set, returns null.
 */
import { createClient } from "@supabase/supabase-js";
import { getPublicConfig } from "@/lib/config";
import { getServerConfig } from "@/lib/config/server";

let adminClient: ReturnType<typeof createClient> | null = null;

/** Treats empty values and obvious .env example placeholders as unset (avoid Supabase "Invalid API key" at runtime). */
export function isUnsetOrPlaceholderServiceRoleKey(key: string): boolean {
  const k = key.trim();
  if (!k) return true;
  const lower = k.toLowerCase();
  if (lower.includes("paste_") || lower.includes("your_") || lower.includes("changeme") || lower.includes("example_"))
    return true;
  if (lower.endsWith("_here")) return true;
  if (lower.includes("placeholder")) return true;
  // Accept classic JWT service_role keys or modern sb_secret_ keys only.
  const looksLikeJwt = k.split(".").length === 3 && k.startsWith("eyJ");
  const looksLikeSecret = lower.startsWith("sb_secret_");
  if (!looksLikeJwt && !looksLikeSecret) return true;
  return false;
}

export function getAdminClient(): ReturnType<typeof createClient> | null {
  const { SUPABASE_SERVICE_ROLE_KEY: key } = getServerConfig();
  if (isUnsetOrPlaceholderServiceRoleKey(key)) return null;
  if (adminClient) return adminClient;
  const { NEXT_PUBLIC_SUPABASE_URL } = getPublicConfig();
  adminClient = createClient(NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: { persistSession: false },
  });
  return adminClient;
}
