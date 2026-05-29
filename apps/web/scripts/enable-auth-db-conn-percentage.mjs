#!/usr/bin/env node
/**
 * Switch Supabase Auth DB pool from absolute connections to percentage allocation.
 * Requires: SUPABASE_ACCESS_TOKEN (PAT from https://supabase.com/dashboard/account/tokens)
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=xxx node apps/web/scripts/enable-auth-db-conn-percentage.mjs
 */

const PROJECT_REF = "vthfrxehrursfloevnlp";
const TARGET_PERCENT = Number(process.env.AUTH_DB_CONN_PERCENT ?? "17");
const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();

if (!token) {
  console.error(
    "Set SUPABASE_ACCESS_TOKEN (Personal Access Token from https://supabase.com/dashboard/account/tokens)",
  );
  process.exit(1);
}

if (!Number.isInteger(TARGET_PERCENT) || TARGET_PERCENT < 1 || TARGET_PERCENT > 100) {
  console.error("AUTH_DB_CONN_PERCENT must be an integer between 1 and 100.");
  process.exit(1);
}

const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`;

const getRes = await fetch(url, {
  headers: { Authorization: `Bearer ${token}` },
});

if (!getRes.ok) {
  const text = await getRes.text();
  console.error("GET auth config failed:", getRes.status, text);
  process.exit(1);
}

const before = await getRes.json();
console.log("Before:", {
  db_max_pool_size: before.db_max_pool_size ?? null,
  db_max_pool_size_unit: before.db_max_pool_size_unit ?? null,
});

if (before.db_max_pool_size_unit === "percent") {
  console.log("Auth DB pool already uses percentage allocation.");
  process.exit(0);
}

const patchRes = await fetch(url, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    db_max_pool_size: TARGET_PERCENT,
    db_max_pool_size_unit: "percent",
  }),
});

if (!patchRes.ok) {
  const text = await patchRes.text();
  console.error("PATCH auth config failed:", patchRes.status, text);
  process.exit(1);
}

const after = await patchRes.json().catch(() => ({}));
console.log("After:", {
  db_max_pool_size: after.db_max_pool_size ?? TARGET_PERCENT,
  db_max_pool_size_unit: after.db_max_pool_size_unit ?? "percent",
});

if (after.db_max_pool_size_unit && after.db_max_pool_size_unit !== "percent") {
  console.error("Supabase did not switch db_max_pool_size_unit to percent.");
  process.exit(1);
}

console.log("Auth DB connection allocation set to percentage successfully.");
