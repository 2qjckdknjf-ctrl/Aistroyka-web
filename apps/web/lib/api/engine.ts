/**
 * Typed engine integration. Wraps RPC and table access per contract.
 * Uses only: create_analysis_job RPC; Supabase client for projects, media, analysis_jobs, ai_analysis, tenants.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { createAnalysisJobRpc } from "./rpcClient";
import { getAdminClient } from "@/lib/supabase/admin";

const MEDIA_BUCKET = "media";

/**
 * Legacy alias kept for compatibility.
 * Returns the active tenant for the current user without auto-creating one.
 */
export async function getOrCreateTenantForCurrentUser(
  supabase: SupabaseClient
): Promise<string | null> {
  return getTenantForCurrentUser(supabase);
}

/**
 * Returns the active tenant for current user.
 * Priority: owned tenant -> tenant_members membership.
 */
export async function getTenantForCurrentUser(
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

    // If user has a pending invitation, do not auto-create a personal tenant.
    const normalizedEmail = (user.email ?? "").trim().toLowerCase();
    if (normalizedEmail) {
      const { data: pendingInvite } = await supabase
        .from("tenant_invitations")
        .select("id")
        .eq("email", normalizedEmail)
        .gt("expires_at", new Date().toISOString())
        .limit(1)
        .maybeSingle();
      if (pendingInvite?.id) return null;
    }

    return null;
  } catch {
    return null;
  }
}

export async function createTenantAndOwnerMembershipForCurrentUser(
  supabase: SupabaseClient,
  params: { name: string; companyType?: string | null }
): Promise<string | null> {
  try {
    const res = await supabase.auth.getUser();
    const user = res?.data?.user ?? null;
    if (!user?.id) return null;

    const existingTenant = await getTenantForCurrentUser(supabase);
    if (existingTenant) return existingTenant;

    const tenantName = params.name.trim() || user.user_metadata?.name || user.email || "Workspace";
    const { data: created, error: insertError } = await supabase
      .from("tenants")
      .insert({ name: tenantName, plan: "free", user_id: user.id })
      .select("id")
      .single();
    if (insertError || !created?.id) return null;

    const tenantId = created.id;
    await supabase.from("tenant_members").upsert(
      { tenant_id: tenantId, user_id: user.id, role: "owner" },
      { onConflict: "tenant_id,user_id" }
    );
    return tenantId;
  } catch {
    return null;
  }
}

/** @deprecated Use getOrCreateTenantForCurrentUser for per-user isolation. */
export async function getDefaultTenantId(
  supabase: SupabaseClient
): Promise<string | null> {
  return getOrCreateTenantForCurrentUser(supabase);
}

/**
 * Create a pending analysis job for the given media. Returns job row or throws.
 * EXECUTE on create_analysis_job is revoked from anon/authenticated
 * (migration 20260527170500), so the RPC always goes through the service-role
 * client. Callers must complete their own auth/ownership checks first; the
 * caller-facing client parameter is intentionally not used for the RPC.
 */
export async function createAnalysisJob(
  _supabase: SupabaseClient,
  params: { tenant_id: string; media_id: string; priority?: "high" | "normal" | "low" }
): Promise<{ id: string; media_id: string; status: string }> {
  const admin = getAdminClient();
  if (!admin) {
    throw new Error(
      "create_analysis_job requires SUPABASE_SERVICE_ROLE_KEY (server-only). Set in env and redeploy."
    );
  }
  const row = await createAnalysisJobRpc(admin, {
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
