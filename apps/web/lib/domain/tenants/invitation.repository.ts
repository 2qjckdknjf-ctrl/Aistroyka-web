import type { SupabaseClient } from "@supabase/supabase-js";

export interface TenantInvitation {
  id: string;
  tenant_id: string;
  email: string;
  role: string;
  token: string;
  created_by: string;
  expires_at: string;
  created_at: string;
}

export async function createInvitation(
  supabase: SupabaseClient,
  tenantId: string,
  email: string,
  role: string,
  createdBy: string,
  expiresAt: string,
  token: string
): Promise<TenantInvitation | null> {
  const { data, error } = await supabase
    .from("tenant_invitations")
    .insert({
      tenant_id: tenantId,
      email,
      role,
      created_by: createdBy,
      expires_at: expiresAt,
      token,
    })
    .select("id, token, email, role, expires_at")
    .single();

  if (error || !data) return null;
  return data as TenantInvitation;
}

export async function getInvitationByToken(
  supabase: SupabaseClient,
  token: string
): Promise<TenantInvitation | null> {
  const { data, error } = await supabase
    .from("tenant_invitations")
    .select("id, tenant_id, email, role, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (error || !data) return null;
  return data as TenantInvitation;
}

export async function deleteInvitation(
  supabase: SupabaseClient,
  invitationId: string
): Promise<boolean> {
  const { error } = await supabase.from("tenant_invitations").delete().eq("id", invitationId);
  return !error;
}

export async function listInvitations(
  supabase: SupabaseClient,
  tenantId: string
): Promise<TenantInvitation[]> {
  const { data, error } = await supabase
    .from("tenant_invitations")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as TenantInvitation[];
}
