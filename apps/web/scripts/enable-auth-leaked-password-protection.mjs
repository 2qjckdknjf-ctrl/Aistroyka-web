#!/usr/bin/env node
/**
 * Enable Supabase Auth leaked password protection (HaveIBeenPwned) via Management API.
 * Requires: SUPABASE_ACCESS_TOKEN (PAT from https://supabase.com/dashboard/account/tokens)
 * Optional: SUPABASE_PROJECT_REF (defaults to AISTROYKA production project)
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=xxx node apps/web/scripts/enable-auth-leaked-password-protection.mjs
 */

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF?.trim() || "vthfrxehrursfloevnlp";
const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();

if (!token) {
  console.error(
    "Set SUPABASE_ACCESS_TOKEN (Personal Access Token from https://supabase.com/dashboard/account/tokens)",
  );
  process.exit(1);
}

const baseUrl = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`;

async function readAuthConfig() {
  const res = await fetch(baseUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET auth config failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function enableLeakedPasswordProtection() {
  const res = await fetch(baseUrl, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password_hibp_enabled: true }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PATCH auth config failed: ${res.status} ${text}`);
  }
  return res.json();
}

const before = await readAuthConfig();
console.log("Before:", {
  password_hibp_enabled: before.password_hibp_enabled ?? null,
});

if (before.password_hibp_enabled === true) {
  console.log("Leaked password protection already enabled.");
  process.exit(0);
}

const after = await enableLeakedPasswordProtection();
console.log("After:", {
  password_hibp_enabled: after.password_hibp_enabled ?? null,
});

if (after.password_hibp_enabled !== true) {
  console.error("Failed to enable leaked password protection.");
  process.exit(1);
}

console.log("Leaked password protection enabled successfully.");
