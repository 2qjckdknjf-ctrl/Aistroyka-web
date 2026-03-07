/**
 * Tenant data access. Supabase queries only; no business logic.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Tenant, TenantMember } from "./tenant.types";

export async function getTenantById(
  supabase: SupabaseClient,
  tenantId: string
): Promise<Tenant | null> {
  const { data, error } = await supabase
    .from("tenants")
    .select("id, name, plan, user_id, created_at")
    .eq("id", tenantId)
    .maybeSingle();
  if (error || !data) return null;
  return data as Tenant;
}

export async function getTenantByUserId(
  supabase: SupabaseClient,
  userId: string
): Promise<Tenant | null> {
  const { data, error } = await supabase
    .from("tenants")
    .select("id, name, plan, user_id, created_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as Tenant;
}

export async function getFirstMembership(
  supabase: SupabaseClient,
  userId: string
): Promise<TenantMember | null> {
  const { data, error } = await supabase
    .from("tenant_members")
    .select("tenant_id, user_id, role, created_at")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data as TenantMember;
}

export async function getMemberRole(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string
): Promise<string | null> {
  const { data: tenant } = await supabase
    .from("tenants")
    .select("user_id")
    .eq("id", tenantId)
    .maybeSingle();
  if (tenant?.user_id === userId) return "owner";
  const { data: member } = await supabase
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .maybeSingle();
  return member?.role ?? null;
}

export async function listMembers(
  supabase: SupabaseClient,
  tenantId: string
): Promise<TenantMember[]> {
  const { data, error } = await supabase
    .from("tenant_members")
    .select("tenant_id, user_id, role, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true });
  if (error) return [];
  return (data ?? []) as TenantMember[];
}

export async function createTenant(
  supabase: SupabaseClient,
  params: { name: string; user_id: string; plan?: string }
): Promise<Tenant | null> {
  const { data, error } = await supabase
    .from("tenants")
    .insert({ name: params.name, user_id: params.user_id, plan: params.plan ?? "free" })
    .select("id, name, plan, user_id, created_at")
    .single();
  if (error || !data) return null;
  return data as Tenant;
}

export async function addMember(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  role: string
): Promise<void> {
  await supabase.from("tenant_members").upsert(
    { tenant_id: tenantId, user_id: userId, role },
    { onConflict: "tenant_id,user_id" }
  );
}

export async function removeMember(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("tenant_members")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("user_id", userId);
  return !error;
}
