/**
 * Server-only Supabase client with service role.
 * Use only in API routes or server code. Never expose to the client.
 * If SUPABASE_SERVICE_ROLE_KEY is not set, returns null.
 */
import { createClient } from "@supabase/supabase-js";
import { getPublicEnv } from "@/lib/env";

let adminClient: ReturnType<typeof createClient> | null = null;

export function getAdminClient(): ReturnType<typeof createClient> | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (typeof key !== "string" || key.length === 0) return null;
  if (adminClient) return adminClient;
  const { NEXT_PUBLIC_SUPABASE_URL } = getPublicEnv();
  adminClient = createClient(NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: { persistSession: false },
  });
  return adminClient;
}
