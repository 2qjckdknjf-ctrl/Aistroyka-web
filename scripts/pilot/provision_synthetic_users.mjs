#!/usr/bin/env node
/**
 * Synthetic pilot Auth + tenant/account membership provisioning (A1–A8).
 *
 * Staging rehearsal only. Does NOT create projects/reports/media.
 * Does NOT apply pilot dataset.
 *
 * Requires (never logged):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   SYNTHETIC_OWNER_PASSWORD, SYNTHETIC_MANAGER_PASSWORD,
 *   SYNTHETIC_WORKER_PASSWORD, SYNTHETIC_STAKEHOLDER_PASSWORD
 *
 * Usage (from repo root):
 *   set -a && source .env.local && source local-secrets/synthetic-pilot-users.env && set +a
 *   node scripts/pilot/provision_synthetic_users.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const OWNER_PASSWORD = process.env.SYNTHETIC_OWNER_PASSWORD;
const MANAGER_PASSWORD = process.env.SYNTHETIC_MANAGER_PASSWORD;
const WORKER_PASSWORD = process.env.SYNTHETIC_WORKER_PASSWORD;
const STAKEHOLDER_PASSWORD = process.env.SYNTHETIC_STAKEHOLDER_PASSWORD;

const SYNTHETIC_COMPANY = "AISTROYKA Synthetic Pilot";
const SYNTHETIC_META = {
  source: "synthetic_pilot_provisioning",
  synthetic: true,
  rehearsal: "staging_day0_a1_a10",
};

/** @type {{ email: string, displayName: string, kind: "owner"|"manager"|"worker"|"stakeholder" }[]} */
const ROSTER = [
  { email: "owner.demo@example.com", displayName: "Demo Owner", kind: "owner" },
  { email: "carlos.manager@example.com", displayName: "Demo Carlos Manager", kind: "manager" },
  { email: "elena.manager@example.com", displayName: "Demo Elena Manager", kind: "manager" },
  { email: "ivan.worker@example.com", displayName: "Demo Ivan Worker", kind: "worker" },
  { email: "pavel.worker@example.com", displayName: "Demo Pavel Worker", kind: "worker" },
  { email: "luis.worker@example.com", displayName: "Demo Luis Worker", kind: "worker" },
  { email: "sofia.client@example.com", displayName: "Demo Sofia Client", kind: "stakeholder" },
];

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

function log(msg) {
  console.log(msg);
}

function passwordFor(kind) {
  switch (kind) {
    case "owner":
      return OWNER_PASSWORD;
    case "manager":
      return MANAGER_PASSWORD;
    case "worker":
      return WORKER_PASSWORD;
    case "stakeholder":
      return STAKEHOLDER_PASSWORD;
    default: {
      const _exhaustive = kind;
      return fail(`unknown kind: ${_exhaustive}`);
    }
  }
}

function tenantRoleFor(kind) {
  switch (kind) {
    case "owner":
      return "owner";
    case "manager":
      return "admin";
    case "worker":
      return "member";
    case "stakeholder":
      return "stakeholder";
    default: {
      const _exhaustive = kind;
      return fail(`unknown kind: ${_exhaustive}`);
    }
  }
}

function maskId(id) {
  if (!id || id.length < 12) return id || "";
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

if (!SUPABASE_URL || !SERVICE_KEY) {
  fail("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}
if (!OWNER_PASSWORD || !MANAGER_PASSWORD || !WORKER_PASSWORD || !STAKEHOLDER_PASSWORD) {
  fail(
    "Missing SYNTHETIC_*_PASSWORD env vars. Source local-secrets/synthetic-pilot-users.env first."
  );
}
if (
  new Set([OWNER_PASSWORD, MANAGER_PASSWORD, WORKER_PASSWORD, STAKEHOLDER_PASSWORD]).size !== 4
) {
  fail("Synthetic passwords must be unique across owner/manager/worker/stakeholder groups");
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(email) {
  let page = 1;
  while (page <= 50) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`listUsers: ${error.message}`);
    const users = data?.users ?? [];
    const u = users.find((x) => (x.email || "").toLowerCase() === email.toLowerCase());
    if (u) return u;
    if (!users.length || users.length < 200) break;
    page += 1;
  }
  return null;
}

async function ensureAuthUser(entry) {
  const existing = await findUserByEmail(entry.email);
  if (existing) {
    // Collision check: reject if existing user is clearly non-synthetic (no example.com already enforced by roster)
    log(`  auth EXISTS ${entry.email} id=${maskId(existing.id)}`);
    // Ensure confirmed
    if (!existing.email_confirmed_at) {
      const { error } = await admin.auth.admin.updateUserById(existing.id, {
        email_confirm: true,
      });
      if (error) throw new Error(`confirm ${entry.email}: ${error.message}`);
      log(`  auth CONFIRMED ${entry.email}`);
    }
    return { id: existing.id, created: false };
  }

  const password = passwordFor(entry.kind);
  const { data, error } = await admin.auth.admin.createUser({
    email: entry.email,
    password,
    email_confirm: true,
    user_metadata: {
      ...SYNTHETIC_META,
      display_name: entry.displayName,
      synthetic_kind: entry.kind,
    },
  });
  if (error || !data?.user?.id) {
    throw new Error(`createUser ${entry.email}: ${error?.message ?? "no user"}`);
  }
  log(`  auth CREATED ${entry.email} id=${maskId(data.user.id)}`);
  return { id: data.user.id, created: true };
}

function tenantAccountSlug(tenantId) {
  return `t-${tenantId.replace(/-/g, "")}`;
}

async function createContractorWorkspace(userId) {
  // Idempotent: if owner already has a tenant as owner, reuse if synthetic name matches
  const { data: existingMembers, error: existingErr } = await admin
    .from("tenant_members")
    .select("tenant_id, role")
    .eq("user_id", userId)
    .eq("role", "owner");
  if (existingErr) throw new Error(`owner membership lookup: ${existingErr.message}`);

  for (const row of existingMembers ?? []) {
    const { data: tenant, error: tErr } = await admin
      .from("tenants")
      .select("id, name, account_id")
      .eq("id", row.tenant_id)
      .maybeSingle();
    if (tErr) throw new Error(`tenant lookup: ${tErr.message}`);
    if (!tenant) continue;
    if (tenant.name === SYNTHETIC_COMPANY && tenant.account_id) {
      log(`  workspace REUSE tenant=${maskId(tenant.id)} account=${maskId(tenant.account_id)}`);
      return { tenantId: tenant.id, accountId: tenant.account_id };
    }
    if (tenant.name && tenant.name !== SYNTHETIC_COMPANY) {
      fail(
        `Owner already has non-synthetic tenant membership (${tenant.name}). Stop to avoid collision.`
      );
    }
  }

  const { data: account, error: accountError } = await admin
    .from("accounts")
    .insert({
      account_type: "contractor",
      display_name: SYNTHETIC_COMPANY,
      status: "active",
      metadata: SYNTHETIC_META,
    })
    .select("id")
    .single();
  if (accountError || !account?.id) {
    throw new Error(`create account: ${accountError?.message ?? "unknown"}`);
  }

  const { data: tenant, error: tenantError } = await admin
    .from("tenants")
    .insert({
      name: SYNTHETIC_COMPANY,
      plan: "free",
      user_id: userId,
      account_id: account.id,
    })
    .select("id")
    .single();
  if (tenantError || !tenant?.id) {
    await admin.from("accounts").delete().eq("id", account.id);
    throw new Error(`create tenant: ${tenantError?.message ?? "unknown"}`);
  }

  const slug = tenantAccountSlug(tenant.id);
  const { error: slugError } = await admin.from("accounts").update({ slug }).eq("id", account.id);
  if (slugError) {
    throw new Error(`account slug: ${slugError.message}`);
  }

  const { error: amErr } = await admin.from("account_members").upsert(
    {
      account_id: account.id,
      user_id: userId,
      role: "owner",
      status: "active",
    },
    { onConflict: "account_id,user_id" }
  );
  if (amErr) throw new Error(`account_members owner: ${amErr.message}`);

  const { error: tmErr } = await admin.from("tenant_members").upsert(
    {
      tenant_id: tenant.id,
      user_id: userId,
      role: "owner",
    },
    { onConflict: "tenant_id,user_id" }
  );
  if (tmErr) throw new Error(`tenant_members owner: ${tmErr.message}`);

  log(`  workspace CREATED tenant=${maskId(tenant.id)} account=${maskId(account.id)}`);
  return { tenantId: tenant.id, accountId: account.id };
}

async function upsertInternalMember(tenantId, accountId, userId, tenantRole) {
  const { error: tmErr } = await admin.from("tenant_members").upsert(
    {
      tenant_id: tenantId,
      user_id: userId,
      role: tenantRole,
    },
    { onConflict: "tenant_id,user_id" }
  );
  if (tmErr) throw new Error(`tenant_members ${tenantRole}: ${tmErr.message}`);

  if (tenantRole === "stakeholder") {
    log(`  membership tenant=${tenantRole} account=SKIPPED (stakeholder_excluded)`);
    return;
  }

  const { error: amErr } = await admin.from("account_members").upsert(
    {
      account_id: accountId,
      user_id: userId,
      role: tenantRole,
      status: "active",
    },
    { onConflict: "account_id,user_id" }
  );
  if (amErr) throw new Error(`account_members ${tenantRole}: ${amErr.message}`);
  log(`  membership tenant=${tenantRole} account=${tenantRole}`);
}

async function assertNoPlatformOwnerGrant(userId, email) {
  const { data, error } = await admin
    .from("platform_owner_grants")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(`platform_owner_grants check: ${error.message}`);
  if (data?.user_id) {
    fail(`${email} unexpectedly has platform_owner_grants — stop`);
  }
}

async function validateAll(tenantId, accountId, userIdsByEmail) {
  const summary = [];
  for (const entry of ROSTER) {
    const userId = userIdsByEmail[entry.email];
    const expectedTenantRole = tenantRoleFor(entry.kind);

    const { data: tm } = await admin
      .from("tenant_members")
      .select("role")
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .maybeSingle();

    const { data: am } = await admin
      .from("account_members")
      .select("role, status")
      .eq("account_id", accountId)
      .eq("user_id", userId)
      .maybeSingle();

    await assertNoPlatformOwnerGrant(userId, entry.email);

    const tenantOk = tm?.role === expectedTenantRole;
    let accountOk = false;
    if (entry.kind === "stakeholder") {
      accountOk = !am;
    } else {
      accountOk = am?.role === expectedTenantRole && am?.status === "active";
    }

    const ok = tenantOk && accountOk;
    summary.push({
      email: entry.email,
      kind: entry.kind,
      userIdMasked: maskId(userId),
      tenantRole: tm?.role ?? null,
      accountRole: am?.role ?? null,
      ok,
    });
    log(
      `  validate ${entry.email}: tenant=${tm?.role ?? "—"} account=${am?.role ?? "—"} ${ok ? "PASS" : "FAIL"}`
    );
  }

  const failed = summary.filter((s) => !s.ok);
  if (failed.length) {
    fail(`Validation failed for ${failed.length} user(s)`);
  }

  // Write a machine-readable local report (no passwords) for docs update
  const reportPath = new URL("../../local-secrets/synthetic-pilot-users-ids.json", import.meta.url);
  const { writeFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const out = {
    generatedAt: new Date().toISOString(),
    company: SYNTHETIC_COMPANY,
    tenantId,
    accountId,
    users: Object.fromEntries(
      ROSTER.map((e) => [
        e.email,
        { id: userIdsByEmail[e.email], kind: e.kind, tenantRole: tenantRoleFor(e.kind) },
      ])
    ),
  };
  writeFileSync(fileURLToPath(reportPath), JSON.stringify(out, null, 2) + "\n", { mode: 0o600 });
  log(`  local id map written (gitignored): local-secrets/synthetic-pilot-users-ids.json`);

  return summary;
}

async function main() {
  log("=== Synthetic pilot user provisioning (A1–A8) ===");
  log(`  supabase: ${new URL(SUPABASE_URL).host}`);
  log(`  company: ${SYNTHETIC_COMPANY}`);
  log(`  run_id: ${randomUUID().slice(0, 8)}`);

  /** @type {Record<string, string>} */
  const userIdsByEmail = {};

  for (const entry of ROSTER) {
    log(`\n[${entry.kind}] ${entry.email}`);
    const { id } = await ensureAuthUser(entry);
    userIdsByEmail[entry.email] = id;
  }

  const ownerId = userIdsByEmail["owner.demo@example.com"];
  log(`\n[workspace] ${SYNTHETIC_COMPANY}`);
  const { tenantId, accountId } = await createContractorWorkspace(ownerId);

  for (const entry of ROSTER) {
    if (entry.kind === "owner") continue;
    log(`\n[membership] ${entry.email}`);
    await upsertInternalMember(
      tenantId,
      accountId,
      userIdsByEmail[entry.email],
      tenantRoleFor(entry.kind)
    );
  }

  log("\n[validate]");
  await validateAll(tenantId, accountId, userIdsByEmail);

  log("\n=== DONE ===");
  log(`TENANT_ID=${tenantId}`);
  log(`ACCOUNT_ID=${accountId}`);
  log("DATASET_APPLIED=NO");
  log("PROJECT_MEMBERSHIPS=NOT_CREATED");
  log("A9_A10=NOT_CREATED (dataset gate)");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
