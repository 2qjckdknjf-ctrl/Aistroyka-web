/**
 * Stage 2.2 — atomic contractor workspace + account_members sync on internal invites.
 * Uses service role for accounts/account_members (RLS write denied for authenticated).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  isAccountMemberEligibleTenantRole,
  tenantAccountSlug,
} from "./account-workspace.constants";

export class AccountWorkspaceError extends Error {
  readonly code = "ACCOUNT_WORKSPACE_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "AccountWorkspaceError";
  }
}

type WorkspaceRollbackState = {
  accountId: string | null;
  tenantId: string | null;
};

async function rollbackPartialWorkspace(
  admin: SupabaseClient,
  state: WorkspaceRollbackState
): Promise<void> {
  if (state.tenantId) {
    await admin.from("tenant_members").delete().eq("tenant_id", state.tenantId);
    await admin.from("tenants").delete().eq("id", state.tenantId);
  }
  if (state.accountId) {
    await admin.from("account_members").delete().eq("account_id", state.accountId);
    await admin.from("accounts").delete().eq("id", state.accountId);
  }
}

function requireAdminClient(): SupabaseClient {
  const admin = getAdminClient();
  if (!admin) {
    throw new AccountWorkspaceError(
      "Workspace provisioning requires SUPABASE_SERVICE_ROLE_KEY (server-only)."
    );
  }
  return admin;
}

/**
 * Creates contractor account + tenant + account_members + tenant_members atomically (best-effort rollback).
 */
export async function createContractorWorkspaceForUser(params: {
  userId: string;
  displayName: string;
}): Promise<{ tenantId: string; accountId: string }> {
  const admin = requireAdminClient();
  const displayName = params.displayName.trim() || "Workspace";
  const state: WorkspaceRollbackState = { accountId: null, tenantId: null };

  try {
    const { data: account, error: accountError } = await admin
      .from("accounts")
      .insert({
        account_type: "contractor",
        display_name: displayName,
        status: "active",
        metadata: { source: "stage2_2_workspace_create" },
      })
      .select("id")
      .single();

    if (accountError || !account?.id) {
      throw new AccountWorkspaceError(
        `Failed to create contractor account: ${accountError?.message ?? "unknown error"}`
      );
    }
    state.accountId = account.id as string;

    const { data: tenant, error: tenantError } = await admin
      .from("tenants")
      .insert({
        name: displayName,
        plan: "free",
        user_id: params.userId,
        account_id: state.accountId,
      })
      .select("id")
      .single();

    if (tenantError || !tenant?.id) {
      throw new AccountWorkspaceError(
        `Failed to create tenant workspace: ${tenantError?.message ?? "unknown error"}`
      );
    }
    state.tenantId = tenant.id as string;

    const slug = tenantAccountSlug(state.tenantId);
    const { error: slugError } = await admin
      .from("accounts")
      .update({ slug })
      .eq("id", state.accountId);
    if (slugError) {
      throw new AccountWorkspaceError(`Failed to finalize account slug: ${slugError.message}`);
    }

    const { error: accountMemberError } = await admin.from("account_members").upsert(
      {
        account_id: state.accountId,
        user_id: params.userId,
        role: "owner",
        status: "active",
      },
      { onConflict: "account_id,user_id" }
    );
    if (accountMemberError) {
      throw new AccountWorkspaceError(
        `Failed to create account owner membership: ${accountMemberError.message}`
      );
    }

    const { error: tenantMemberError } = await admin.from("tenant_members").upsert(
      {
        tenant_id: state.tenantId,
        user_id: params.userId,
        role: "owner",
      },
      { onConflict: "tenant_id,user_id" }
    );
    if (tenantMemberError) {
      throw new AccountWorkspaceError(
        `Failed to create tenant owner membership: ${tenantMemberError.message}`
      );
    }

    return { tenantId: state.tenantId, accountId: state.accountId };
  } catch (error) {
    await rollbackPartialWorkspace(admin, state);
    if (error instanceof AccountWorkspaceError) throw error;
    throw new AccountWorkspaceError(
      error instanceof Error ? error.message : "Contractor workspace creation failed"
    );
  }
}

/**
 * Upserts account_members after internal tenant invite accept.
 * Stakeholders and unknown roles are skipped without error.
 */
export async function syncAccountMemberForInternalTenantRole(params: {
  tenantId: string;
  userId: string;
  tenantRole: string;
}): Promise<{ synced: boolean; skippedReason?: string }> {
  if (params.tenantRole === "stakeholder") {
    return { synced: false, skippedReason: "stakeholder_excluded" };
  }

  if (!isAccountMemberEligibleTenantRole(params.tenantRole)) {
    return { synced: false, skippedReason: "role_not_eligible" };
  }

  const admin = requireAdminClient();

  const { data: tenant, error: tenantError } = await admin
    .from("tenants")
    .select("account_id")
    .eq("id", params.tenantId)
    .maybeSingle();

  if (tenantError) {
    throw new AccountWorkspaceError(`Unable to load tenant account linkage: ${tenantError.message}`);
  }

  const accountId = tenant?.account_id as string | undefined;
  if (!accountId) {
    throw new AccountWorkspaceError(
      `Tenant ${params.tenantId} has no account_id. Stage 2.1 backfill required before invite accept.`
    );
  }

  const { error: upsertError } = await admin.from("account_members").upsert(
    {
      account_id: accountId,
      user_id: params.userId,
      role: params.tenantRole,
      status: "active",
    },
    { onConflict: "account_id,user_id" }
  );

  if (upsertError) {
    throw new AccountWorkspaceError(`Failed to sync account membership: ${upsertError.message}`);
  }

  return { synced: true };
}
