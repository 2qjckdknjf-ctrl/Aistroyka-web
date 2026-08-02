/**
 * Typed engine integration. Wraps RPC and table access per contract.
 * Uses only: create_analysis_job RPC; Supabase client for projects, media, analysis_jobs, ai_analysis, tenants.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { createContractorWorkspaceForUser } from "@/lib/account/account-workspace.service";
import { createAnalysisJobRpc } from "./rpcClient";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  isActiveTenantResolutionBlocked,
  resolveActiveTenantId,
  type ActiveTenantRequestLike,
  type ResolveActiveTenantResult,
} from "@/lib/tenant/active-tenant";

const MEDIA_BUCKET = "media";

export class ActiveTenantBlockedError extends Error {
  readonly code = "ACTIVE_TENANT_BLOCKED" as const;
  readonly explicitRejected: boolean;
  readonly queryError: boolean;

  constructor(result: ResolveActiveTenantResult) {
    super(
      result.queryError
        ? "Active tenant lookup failed."
        : "Active tenant selection rejected."
    );
    this.name = "ActiveTenantBlockedError";
    this.explicitRejected = result.explicitRejected;
    this.queryError = result.queryError;
  }
}

const UNauthenticated: ResolveActiveTenantResult = {
  tenantId: null,
  source: "none",
  explicitRejected: false,
  queryError: false,
};

/**
 * Full active-tenant resolution for the current user (preserves fail-closed flags).
 * Prefer this over getTenantForCurrentUser whenever auto-create / onboarding decisions depend on the result.
 */
export async function resolveTenantForCurrentUser(
  supabase: SupabaseClient,
  requestLike?: ActiveTenantRequestLike | null
): Promise<ResolveActiveTenantResult> {
  try {
    const res = await supabase.auth.getUser();
    const user = res?.data?.user ?? null;
    if (!user?.id) return UNauthenticated;

    return await resolveActiveTenantId(supabase, user.id, requestLike ?? null);
  } catch {
    return {
      tenantId: null,
      source: "none",
      explicitRejected: false,
      queryError: true,
    };
  }
}

/**
 * Legacy alias kept for compatibility.
 * Returns the active tenant for the current user without auto-creating one.
 * Pass Request/Headers whenever the caller has HTTP context so `x-tenant-id` /
 * `aistroyka_active_tenant` apply (same contract as resolveActiveTenantId).
 */
export async function getOrCreateTenantForCurrentUser(
  supabase: SupabaseClient,
  requestLike?: ActiveTenantRequestLike | null
): Promise<string | null> {
  return getTenantForCurrentUser(supabase, requestLike);
}

/**
 * Returns the active tenant id for the current user, or null.
 * Note: null may mean absent membership OR a blocked explicit claim/query error.
 * Do not use null alone to decide auto-create — use resolveTenantForCurrentUser /
 * isActiveTenantResolutionBlocked / createTenantAndOwnerMembershipForCurrentUser.
 */
export async function getTenantForCurrentUser(
  supabase: SupabaseClient,
  requestLike?: ActiveTenantRequestLike | null
): Promise<string | null> {
  const active = await resolveTenantForCurrentUser(supabase, requestLike);
  if (active.tenantId) return active.tenantId;

  // Preserve fail-closed: blocked resolutions stay null (callers that auto-create
  // must check resolveTenantForCurrentUser / ActiveTenantBlockedError).
  if (isActiveTenantResolutionBlocked(active)) return null;

  try {
    const res = await supabase.auth.getUser();
    const user = res?.data?.user ?? null;
    if (!user?.id) return null;

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

/**
 * Create a contractor workspace for the current user when none exists.
 * Fail-closed: refused when request carries a rejected explicit claim or query error
 * (never creates a new tenant to "recover" from bad x-tenant-id / cookie).
 */
export async function createTenantAndOwnerMembershipForCurrentUser(
  supabase: SupabaseClient,
  params: { name: string; companyType?: string | null },
  requestLike?: ActiveTenantRequestLike | null
): Promise<string | null> {
  const res = await supabase.auth.getUser();
  const user = res?.data?.user ?? null;
  if (!user?.id) return null;

  const existing = await resolveTenantForCurrentUser(supabase, requestLike);
  if (isActiveTenantResolutionBlocked(existing)) {
    throw new ActiveTenantBlockedError(existing);
  }
  if (existing.tenantId) return existing.tenantId;

  const tenantName =
    params.name.trim() ||
    (typeof user.user_metadata?.name === "string" ? user.user_metadata.name : "") ||
    user.email ||
    "Workspace";

  const { tenantId } = await createContractorWorkspaceForUser({
    userId: user.id,
    displayName: tenantName,
  });
  return tenantId;
}

/** @deprecated Use getOrCreateTenantForCurrentUser for per-user isolation. */
export async function getDefaultTenantId(
  supabase: SupabaseClient,
  requestLike?: ActiveTenantRequestLike | null
): Promise<string | null> {
  return getOrCreateTenantForCurrentUser(supabase, requestLike);
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
