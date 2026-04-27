#!/usr/bin/env node
/**
 * Idempotent: attach an existing Supabase Auth user (SMOKE_EMAIL) to the production pilot tenant via tenant_members.
 * Requires SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL (+ NEXT_PUBLIC_SUPABASE_ANON_KEY unused but ok).
 * Does not print secrets or JWTs.
 *
 * Usage (from repo root; .env.local must include SERVICE_ROLE — gitignored):
 *   set -a && source .env.local && set +a && node scripts/smoke/attach_smoke_user_tenant.mjs
 *
 * Tenant id matches scripts/smoke/bootstrap_smoke_user.mjs (pilot "Default" workspace).
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SMOKE_EMAIL = process.env.SMOKE_EMAIL?.trim();
/** @type {string} */
const TENANT_ID =
  process.env.PILOT_TENANT_ID?.trim() || "6414f756-aa54-48f5-91e2-f852a7c1e837";
const ROLE = process.env.PILOT_TENANT_ROLE?.trim() || "admin";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL (see docs/launch/STAGE4_BLOCKER_RESOLUTION_AUTH_AND_PILOT_PREP.md)");
  process.exit(1);
}
if (!SMOKE_EMAIL) {
  console.error("Missing SMOKE_EMAIL");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let userId = null;
let page = 1;
const perPage = 200;
while (!userId && page <= 50) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
  if (error) {
    console.error("listUsers:", error.message);
    process.exit(1);
  }
  const users = data?.users ?? [];
  const u = users.find((x) => (x.email || "").toLowerCase() === SMOKE_EMAIL.toLowerCase());
  if (u) userId = u.id;
  else if (!users.length || users.length < perPage) break;
  else page += 1;
}

if (!userId) {
  console.error("No auth user found for SMOKE_EMAIL");
  process.exit(1);
}

const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/tenant_members`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    Prefer: "return=minimal",
  },
  body: JSON.stringify({
    tenant_id: TENANT_ID,
    user_id: userId,
    role: ROLE,
  }),
});

if (!insertRes.ok && insertRes.status !== 409) {
  const t = await insertRes.text();
  console.error("tenant_members insert failed:", insertRes.status, t);
  process.exit(1);
}

console.log("tenant_members: ok (insert or already present) for tenant", TENANT_ID);
process.exit(0);
