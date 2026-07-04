#!/usr/bin/env node
/**
 * Provision a platform_owner_grants row for an existing Supabase auth user (service role only).
 *
 * Usage:
 *   PLATFORM_OWNER_GRANT_EMAIL=owner@example.com node scripts/bootstrap-platform-owner-grant.mjs
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY (+ NEXT_PUBLIC_SUPABASE_URL) in env or apps/web/.env.local.
 * Does not create users; does not bypass Cloudflare Access or RBAC in app code.
 */

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(path.join(process.cwd(), ".env.local"));
loadEnvFile(path.join(process.cwd(), "../../.env.local"));

const email = process.env.PLATFORM_OWNER_GRANT_EMAIL?.trim().toLowerCase();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!email) {
  console.error("Set PLATFORM_OWNER_GRANT_EMAIL to the Supabase auth user email.");
  process.exit(1);
}
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const role = (process.env.PLATFORM_OWNER_GRANT_ROLE?.trim() || "OWNER").toUpperCase();
const allowedRoles = new Set(["OWNER", "OWNER_OPERATOR", "OWNER_READONLY"]);
if (!allowedRoles.has(role)) {
  console.error(`Invalid PLATFORM_OWNER_GRANT_ROLE: ${role}`);
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: users, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (listError) {
  console.error("listUsers failed:", listError.message);
  process.exit(1);
}

const user = users.users.find((u) => (u.email ?? "").toLowerCase() === email);
if (!user) {
  console.error(`No auth.users row for email (masked): ${email.replace(/^(.{2}).*@/, "$1***@")}`);
  process.exit(1);
}

const { error: upsertError } = await admin.from("platform_owner_grants").upsert(
  { user_id: user.id, role, granted_at: new Date().toISOString() },
  { onConflict: "user_id" }
);

if (upsertError) {
  console.error("Grant upsert failed:", upsertError.message);
  process.exit(1);
}

console.log("OK platform_owner_grants provisioned");
console.log("user_id:", user.id);
console.log("role:", role);
console.log("email:", email.replace(/^(.{2}).*@/, "$1***@"));
