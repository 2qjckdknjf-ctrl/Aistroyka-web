/**
 * Server-only Supabase client with service role.
 * Use only in API routes or server code. Never expose to the client.
 * If SUPABASE_SERVICE_ROLE_KEY is not set, returns null.
 */
import { createClient } from "@supabase/supabase-js";
import { getPublicConfig } from "@/lib/config";
import { getServerConfig } from "@/lib/config/server";

let adminClient: ReturnType<typeof createClient> | null = null;

export function getAdminClient(): ReturnType<typeof createClient> | null {
  const { SUPABASE_SERVICE_ROLE_KEY: key } = getServerConfig();
  if (!key) return null;
  if (adminClient) return adminClient;
  const { NEXT_PUBLIC_SUPABASE_URL } = getPublicConfig();
  adminClient = createClient(NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: { persistSession: false },
  });
  return adminClient;
}
