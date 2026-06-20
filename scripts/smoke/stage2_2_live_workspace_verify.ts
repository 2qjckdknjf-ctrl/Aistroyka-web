#!/usr/bin/env bun
/**
 * Stage 2.2 live DB verification — runs app workspace service against live Supabase.
 * Does NOT print secrets. Creates tagged test data and cleans up.
 *
 * Usage (repo root):
 *   set -a && source apps/web/.env.local && set +a && bun scripts/smoke/stage2_2_live_workspace_verify.ts
 */
import { createClient } from "@supabase/supabase-js";
import {
  createContractorWorkspaceForUser,
  syncAccountMemberForInternalTenantRole,
} from "../../apps/web/lib/account/account-workspace.service";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("BLOCKER: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment");
  process.exit(2);
}

const TAG = `stage2_2_verify_${Date.now()}`;
const TEST_EMAIL = `${TAG}@internal-verify.invalid`;

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type VerifyResult = {
  signup: Record<string, string | boolean>;
  inviteAdmin: Record<string, string | boolean>;
  stakeholderSkip: Record<string, string | boolean>;
  cleanup: Record<string, string | boolean>;
};

async function main(): Promise<void> {
  const result: VerifyResult = {
    signup: {},
    inviteAdmin: {},
    stakeholderSkip: {},
    cleanup: {},
  };

  let userId: string | null = null;
  let tenantId: string | null = null;
  let accountId: string | null = null;
  let inviteUserId: string | null = null;

  const { data: createdUser, error: createUserError } = await admin.auth.admin.createUser({
    email: TEST_EMAIL,
    email_confirm: true,
    user_metadata: { stage2_2_verify: TAG },
  });

  if (createUserError || !createdUser.user?.id) {
    console.error("FAIL: could not create test auth user", createUserError?.message);
    process.exit(1);
  }
  userId = createdUser.user.id;

  try {
    const workspace = await createContractorWorkspaceForUser({
      userId,
      displayName: `Verify ${TAG}`,
    });
    tenantId = workspace.tenantId;
    accountId = workspace.accountId;

    const { data: tenantRow } = await admin
      .from("tenants")
      .select("id, account_id")
      .eq("id", tenantId)
      .maybeSingle();
    const { data: accountRow } = await admin
      .from("accounts")
      .select("id, account_type, display_name")
      .eq("id", accountId)
      .maybeSingle();
    const { data: amRow } = await admin
      .from("account_members")
      .select("role, status")
      .eq("account_id", accountId)
      .eq("user_id", userId)
      .maybeSingle();
    const { data: tmRow } = await admin
      .from("tenant_members")
      .select("role")
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .maybeSingle();

    result.signup = {
      account_created: accountRow?.account_type === "contractor",
      tenant_has_account_id: tenantRow?.account_id === accountId,
      account_member_owner: amRow?.role === "owner" && amRow?.status === "active",
      tenant_member_owner: tmRow?.role === "owner",
      tenant_id: tenantId,
      account_id: accountId,
    };

    const { data: inviteUser, error: inviteUserError } = await admin.auth.admin.createUser({
      email: `${TAG}_invite@internal-verify.invalid`,
      email_confirm: true,
    });
    if (inviteUserError || !inviteUser.user?.id) {
      throw new Error(`invite user create failed: ${inviteUserError?.message}`);
    }
    inviteUserId = inviteUser.user.id;

    await admin.from("tenant_members").upsert(
      { tenant_id: tenantId, user_id: inviteUserId, role: "admin" },
      { onConflict: "tenant_id,user_id" }
    );

    const syncAdmin = await syncAccountMemberForInternalTenantRole({
      tenantId,
      userId: inviteUserId,
      tenantRole: "admin",
    });

    const { data: inviteAm } = await admin
      .from("account_members")
      .select("role")
      .eq("account_id", accountId)
      .eq("user_id", inviteUserId)
      .maybeSingle();

    result.inviteAdmin = {
      synced: syncAdmin.synced,
      account_member_role_admin: inviteAm?.role === "admin",
    };

    const syncStakeholder = await syncAccountMemberForInternalTenantRole({
      tenantId,
      userId: inviteUserId,
      tenantRole: "stakeholder",
    });

    const { count: stakeholderAmCount } = await admin
      .from("account_members")
      .select("id", { count: "exact", head: true })
      .eq("account_id", accountId)
      .eq("user_id", inviteUserId)
      .eq("role", "stakeholder");

    result.stakeholderSkip = {
      skipped: !syncStakeholder.synced,
      skip_reason: syncStakeholder.skippedReason ?? "",
      no_stakeholder_account_member: (stakeholderAmCount ?? 0) === 0,
    };
  } finally {
    if (tenantId) {
      await admin.from("tenant_members").delete().eq("tenant_id", tenantId);
      await admin.from("tenants").delete().eq("id", tenantId);
    }
    if (accountId) {
      await admin.from("account_members").delete().eq("account_id", accountId);
      await admin.from("accounts").delete().eq("id", accountId);
    }
    if (inviteUserId) {
      await admin.auth.admin.deleteUser(inviteUserId);
    }
    if (userId) {
      await admin.auth.admin.deleteUser(userId);
    }

    result.cleanup = {
      tenant_removed: tenantId ? true : false,
      account_removed: accountId ? true : false,
      users_removed: userId ? true : false,
    };
  }

  console.log(JSON.stringify({ tag: TAG, ok: true, result }, null, 2));
}

main().catch((err) => {
  console.error("FAIL:", err instanceof Error ? err.message : err);
  process.exit(1);
});
