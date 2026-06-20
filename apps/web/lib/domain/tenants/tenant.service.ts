/**
 * Tenant orchestration. Resolve active tenant for user; create if needed.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { createContractorWorkspaceForUser } from "@/lib/account/account-workspace.service";
import { getSessionUser } from "@/lib/supabase/server";
import * as repo from "./tenant.repository";
import type { Tenant } from "./tenant.types";

export async function getOrCreateTenantForUser(
  supabase: SupabaseClient
): Promise<string | null> {
  const user = await getSessionUser(supabase);
  if (!user?.id) return null;

  const own = await repo.getTenantByUserId(supabase, user.id);
  if (own?.id) return own.id;

  const member = await repo.getFirstMembership(supabase, user.id);
  if (member?.tenant_id) return member.tenant_id;

  const name = user.email ?? "Personal";
  const { tenantId } = await createContractorWorkspaceForUser({
    userId: user.id,
    displayName: name,
  });
  return tenantId;
}

export async function getTenant(
  supabase: SupabaseClient,
  tenantId: string
): Promise<Tenant | null> {
  return repo.getTenantById(supabase, tenantId);
}
