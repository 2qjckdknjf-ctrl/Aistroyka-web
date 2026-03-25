#!/usr/bin/env node
/**
 * Minimal STAGE 4 seed: one project + project_members row for SMOKE_EMAIL on PILOT_TENANT_ID.
 * Worker GET /api/v1/projects uses project_members (see project.repository listByUserMembership).
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SMOKE_EMAIL
 * Optional: PILOT_TENANT_ID, PILOT_PROJECT_ID, PILOT_PROJECT_NAME
 *
 * Usage (repo root):
 *   set -a && source .env.local && set +a && node scripts/smoke/seed_pilot_project.mjs
 *
 * Does not print secrets. Idempotent.
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SMOKE_EMAIL = process.env.SMOKE_EMAIL?.trim();
const TENANT_ID =
  process.env.PILOT_TENANT_ID?.trim() || "6414f756-aa54-48f5-91e2-f852a7c1e837";
const PROJECT_ID =
  process.env.PILOT_PROJECT_ID?.trim() || "a0000003-0000-4000-8000-000000000001";
const PROJECT_NAME = process.env.PILOT_PROJECT_NAME?.trim() || "STAGE4 Pilot Project";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL");
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

const { error: pErr } = await admin.from("projects").upsert(
  { id: PROJECT_ID, name: PROJECT_NAME, tenant_id: TENANT_ID },
  { onConflict: "id" }
);
if (pErr) {
  console.error("projects upsert:", pErr.message);
  process.exit(1);
}

const { error: mErr } = await admin.from("project_members").upsert(
  {
    tenant_id: TENANT_ID,
    project_id: PROJECT_ID,
    user_id: userId,
    role: "worker",
    status: "active",
  },
  { onConflict: "tenant_id,project_id,user_id" }
);
if (mErr) {
  console.error("project_members upsert:", mErr.message);
  process.exit(1);
}

console.log("seed_pilot_project: ok");
console.log("  tenant_id:", TENANT_ID);
console.log("  project_id:", PROJECT_ID);
console.log("  user_id:", userId, "(SMOKE_EMAIL)");
process.exit(0);
