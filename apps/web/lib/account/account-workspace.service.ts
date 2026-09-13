/**
 * Stage 2.2 — atomic contractor workspace + account_members sync on internal invites.
 * Uses service role for accounts/account_members (RLS write denied for authenticated).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminClient } from "@/lib/supabase/admin";
import type {
  AccountMemberRole,
  AccountMemberStatus,
} from "./account.types";
import {
  type AccountMemberEligibleTenantRole,
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

type AccountMemberSyncTarget =
  | {
      accountId: string;
      role: AccountMemberEligibleTenantRole;
    }
  | {
      accountId: null;
      skippedReason: "stakeholder_excluded" | "role_not_eligible";
    };

type AccountMemberSnapshot = {
  role: AccountMemberRole;
  status: AccountMemberStatus;
} | null;

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

async function resolveAccountMemberSyncTarget(
  admin: SupabaseClient,
  params: {
    tenantId: string;
    tenantRole: string;
  }
): Promise<AccountMemberSyncTarget> {
  if (params.tenantRole === "stakeholder") {
    return { accountId: null, skippedReason: "stakeholder_excluded" };
  }

  if (!isAccountMemberEligibleTenantRole(params.tenantRole)) {
    return { accountId: null, skippedReason: "role_not_eligible" };
  }

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

  return { accountId, role: params.tenantRole };
}

async function loadAccountMemberSnapshot(
  admin: SupabaseClient,
  params: {
    accountId: string;
    userId: string;
  }
): Promise<AccountMemberSnapshot> {
  const { data, error } = await admin
    .from("account_members")
    .select("role, status")
    .eq("account_id", params.accountId)
    .eq("user_id", params.userId)
    .maybeSingle();

  if (error) {
    throw new AccountWorkspaceError(`Unable to load account membership: ${error.message}`);
  }

  if (!data?.role || !data?.status) return null;
  return {
    role: data.role as AccountMemberRole,
    status: data.status as AccountMemberStatus,
  };
}

async function upsertAccountMember(
  admin: SupabaseClient,
  params: {
    accountId: string;
    userId: string;
    role: AccountMemberEligibleTenantRole;
  }
): Promise<void> {
  const { error } = await admin.from("account_members").upsert(
    {
      account_id: params.accountId,
      user_id: params.userId,
      role: params.role,
      status: "active",
    },
    { onConflict: "account_id,user_id" }
  );

  if (error) {
    throw new AccountWorkspaceError(`Failed to sync account membership: ${error.message}`);
  }
}

async function restoreAccountMemberSnapshot(
  admin: SupabaseClient,
  params: {
    accountId: string;
    userId: string;
    snapshot: AccountMemberSnapshot;
  }
): Promise<void> {
  if (params.snapshot) {
    await admin.from("account_members").upsert(
      {
        account_id: params.accountId,
        user_id: params.userId,
        role: params.snapshot.role,
        status: params.snapshot.status,
      },
      { onConflict: "account_id,user_id" }
    );
    return;
  }

  await admin
    .from("account_members")
    .delete()
    .eq("account_id", params.accountId)
    .eq("user_id", params.userId);
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
  const admin = requireAdminClient();
  const target = await resolveAccountMemberSyncTarget(admin, params);
  if (target.accountId === null) {
    return { synced: false, skippedReason: target.skippedReason };
  }

  await upsertAccountMember(admin, {
    accountId: target.accountId,
    userId: params.userId,
    role: target.role,
  });

  return { synced: true };
}

/**
 * Accepts an internal tenant invite without leaving tenant_members access behind
 * if the Stage 2 account_members sync cannot be completed.
 */
export async function acceptInternalTenantInviteMembership(params: {
  tenantId: string;
  userId: string;
  tenantRole: string;
}): Promise<{ synced: boolean; skippedReason?: string }> {
  const admin = requireAdminClient();
  const target = await resolveAccountMemberSyncTarget(admin, params);
  let accountSnapshot: AccountMemberSnapshot = null;

  if (target.accountId) {
    accountSnapshot = await loadAccountMemberSnapshot(admin, {
      accountId: target.accountId,
      userId: params.userId,
    });
    await upsertAccountMember(admin, {
      accountId: target.accountId,
      userId: params.userId,
      role: target.role,
    });
  }

  const { error: tenantMemberError } = await admin.from("tenant_members").upsert(
    {
      tenant_id: params.tenantId,
      user_id: params.userId,
      role: params.tenantRole,
    },
    { onConflict: "tenant_id,user_id" }
  );

  if (tenantMemberError) {
    if (target.accountId) {
      await restoreAccountMemberSnapshot(admin, {
        accountId: target.accountId,
        userId: params.userId,
        snapshot: accountSnapshot,
      });
    }
    throw new AccountWorkspaceError(
      `Failed to create tenant membership: ${tenantMemberError.message}`
    );
  }

  if (target.accountId === null) {
    return { synced: false, skippedReason: target.skippedReason };
  }
  return { synced: true };
}
