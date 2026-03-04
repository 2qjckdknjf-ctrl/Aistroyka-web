/**
 * Tenant orchestration. Resolve active tenant for user; create if needed.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import * as repo from "./tenant.repository";
import type { Tenant } from "./tenant.types";

export async function getOrCreateTenantForUser(
  supabase: SupabaseClient
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return null;

  const own = await repo.getTenantByUserId(supabase, user.id);
  if (own?.id) return own.id;

  const member = await repo.getFirstMembership(supabase, user.id);
  if (member?.tenant_id) return member.tenant_id;

  const name = user.user_metadata?.name ?? user.email ?? "Personal";
  const created = await repo.createTenant(supabase, { name, user_id: user.id });
  if (created?.id) {
    await repo.addMember(supabase, created.id, user.id, "owner");
    return created.id;
  }

  const { data: fallback } = await supabase.from("tenants").select("id").limit(1).maybeSingle();
  return fallback?.id ?? null;
}

export async function getTenant(
  supabase: SupabaseClient,
  tenantId: string
): Promise<Tenant | null> {
  return repo.getTenantById(supabase, tenantId);
}
