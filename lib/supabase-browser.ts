import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getPublicEnv } from "@/lib/env";

let instance: SupabaseClient | null = null;

/**
 * Singleton Supabase client for browser usage.
 */
export function getSupabaseBrowser(): SupabaseClient {
  if (!instance) {
    const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getPublicEnv();
    instance = createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY);
  }
  return instance;
}
