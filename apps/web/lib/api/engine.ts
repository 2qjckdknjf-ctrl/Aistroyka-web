/**
 * Typed engine integration. Wraps RPC and table access per contract.
 * Uses only: create_analysis_job RPC; Supabase client for projects, media, analysis_jobs, ai_analysis, tenants.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { createAnalysisJobRpc } from "./rpcClient";

const MEDIA_BUCKET = "media";

/** Fallback when new schema (user_id, tenant_members) is not applied: use first tenant. */
async function getFirstTenantId(supabase: SupabaseClient): Promise<string | null> {
  const { data, error } = await supabase.from("tenants").select("id").limit(1).maybeSingle();
  return error ? null : data?.id ?? null;
}

/**
 * Get or create tenant for the current user.
 * 1) Tenant where user_id = me (owner cabinet)
 * 2) Else first tenant from tenant_members (invited)
 * 3) Else create new tenant and add self as owner
 * 4) Fallback: first tenant (when migrations not applied)
 */
export async function getOrCreateTenantForCurrentUser(
  supabase: SupabaseClient
): Promise<string | null> {
  try {
    const res = await supabase.auth.getUser();
    const user = res?.data?.user ?? null;
    if (!user?.id) return null;

    const { data: ownTenant, error: e1 } = await supabase
      .from("tenants")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!e1 && ownTenant?.id) return ownTenant.id;

    const { data: memberRow, error: e2 } = await supabase
      .from("tenant_members")
      .select("tenant_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    if (!e2 && memberRow?.tenant_id) return memberRow.tenant_id;

    const name = user.user_metadata?.name ?? user.email ?? "Personal";
    const { data: created, error: insertError } = await supabase
      .from("tenants")
      .insert({ name, plan: "free", user_id: user.id })
      .select("id")
      .single();
    if (!insertError && created?.id) {
      const tenantId = created.id;
      await supabase.from("tenant_members").upsert(
        { tenant_id: tenantId, user_id: user.id, role: "owner" },
        { onConflict: "tenant_id,user_id" }
      );
      return tenantId;
    }

    return await getFirstTenantId(supabase);
  } catch {
    return await getFirstTenantId(supabase);
  }
}

/** @deprecated Use getOrCreateTenantForCurrentUser for per-user isolation. */
export async function getDefaultTenantId(
  supabase: SupabaseClient
): Promise<string | null> {
  return getOrCreateTenantForCurrentUser(supabase);
}

/** Create a pending analysis job for the given media. Returns job row or throws. */
export async function createAnalysisJob(
  supabase: SupabaseClient,
  params: { tenant_id: string; media_id: string; priority?: "high" | "normal" | "low" }
): Promise<{ id: string; media_id: string; status: string }> {
  const row = await createAnalysisJobRpc(supabase, {
    p_tenant_id: params.tenant_id,
    p_media_id: params.media_id,
    p_priority: params.priority ?? "normal",
  });
  return {
    id: row.id,
    media_id: row.media_id,
    status: row.status,
  };
}

export { MEDIA_BUCKET };
