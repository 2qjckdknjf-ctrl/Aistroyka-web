/**
 * OIDC flow: state/nonce storage and provider config. Auth code exchange is app-specific (Supabase OIDC or custom).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { IdentityProviderRow } from "./identity.types";

export async function getOidcProvider(
  supabase: SupabaseClient,
  tenantId: string
): Promise<IdentityProviderRow | null> {
  const { data, error } = await supabase
    .from("identity_providers")
    .select("tenant_id, type, issuer, client_id, metadata, enabled, created_at")
    .eq("tenant_id", tenantId)
    .eq("type", "oidc")
    .eq("enabled", true)
    .maybeSingle();
  if (error || !data) return null;
  return data as IdentityProviderRow;
}

export async function saveSsoState(
  supabase: SupabaseClient,
  params: { tenantId: string; state: string; nonce?: string | null; expiresAt: Date }
): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from("sso_sessions")
    .insert({
      tenant_id: params.tenantId,
      state: params.state,
      nonce: params.nonce ?? null,
      expires_at: params.expiresAt.toISOString(),
    })
    .select("id")
    .single();
  if (error || !data) return null;
  return { id: (data as { id: string }).id };
}

export async function consumeSsoState(
  supabase: SupabaseClient,
  state: string
): Promise<{ tenantId: string; nonce: string | null } | null> {
  const { data, error } = await supabase
    .from("sso_sessions")
    .select("tenant_id, nonce")
    .eq("state", state)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (error || !data) return null;
  await supabase.from("sso_sessions").delete().eq("state", state);
  return { tenantId: (data as { tenant_id: string }).tenant_id, nonce: (data as { nonce: string | null }).nonce };
}
