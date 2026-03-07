#!/usr/bin/env node
/**
 * One-time bootstrap: create smoke.manager@example.com via Supabase Admin API,
 * add to Default tenant, then run pilot_launch.sh with Bearer token (token not printed).
 * Requires: SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, BASE_URL
 */
import { spawnSync } from "child_process";
import { randomBytes } from "crypto";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BASE_URL = process.env.BASE_URL || "https://aistroyka.ai";

const SMOKE_EMAIL = "smoke.manager@example.com";

if (!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY) {
  console.error("Need SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const password = randomBytes(16).toString("hex");

// Create user via Admin API
const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "apikey": SERVICE_KEY,
    "Authorization": `Bearer ${SERVICE_KEY}`,
  },
  body: JSON.stringify({
    email: SMOKE_EMAIL,
    password,
    email_confirm: true,
  }),
});

if (!createRes.ok) {
  const t = await createRes.text();
  if (t.includes("already been registered")) {
    console.error("User already exists. Use SMOKE_EMAIL/SMOKE_PASSWORD with existing password or delete user in Dashboard.");
  } else {
    console.error("Create user failed:", createRes.status, t);
  }
  process.exit(1);
}

const userData = await createRes.json();
const userId = userData.id;

// Link to Default tenant (tenant_id from prod)
const TENANT_ID = "6414f756-aa54-48f5-91e2-f852a7c1e837";
const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/tenant_members`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "apikey": SERVICE_KEY,
    "Authorization": `Bearer ${SERVICE_KEY}`,
    "Prefer": "return=minimal",
  },
  body: JSON.stringify({ tenant_id: TENANT_ID, user_id: userId, role: "admin" }),
});

if (!insertRes.ok && insertRes.status !== 409) {
  console.error("Insert tenant_members failed:", insertRes.status, await insertRes.text());
}

// Sign in to get token
const tokenRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "apikey": ANON_KEY },
  body: JSON.stringify({ email: SMOKE_EMAIL, password }),
});

if (!tokenRes.ok) {
  console.error("Sign-in failed:", tokenRes.status, await tokenRes.text());
  process.exit(1);
}

const tokenData = await tokenRes.json();
const accessToken = tokenData.access_token;
if (!accessToken) {
  console.error("No access_token in response");
  process.exit(1);
}

// Run pilot_launch with AUTH_HEADER (token not printed)
const env = { ...process.env, BASE_URL, AUTH_HEADER: `Bearer ${accessToken}` };
const out = spawnSync("bash", ["./scripts/smoke/pilot_launch.sh"], { env, stdio: "inherit", cwd: process.cwd() });
process.exit(out.status ?? 1);
