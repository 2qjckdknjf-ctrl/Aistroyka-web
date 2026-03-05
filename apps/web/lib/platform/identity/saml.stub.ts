/**
 * SAML stub. Full implementation deferred; architecture hook for enterprise.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export async function getSamlProvider(
  _supabase: SupabaseClient,
  _tenantId: string
): Promise<{ tenant_id: string; issuer: string | null } | null> {
  return null;
}
