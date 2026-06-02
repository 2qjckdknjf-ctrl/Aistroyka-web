#!/usr/bin/env node
/**
 * Enable Supabase Auth leaked password protection (HaveIBeenPwned) via Management API.
 * Requires: SUPABASE_ACCESS_TOKEN (PAT from https://supabase.com/dashboard/account/tokens)
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=xxx node apps/web/scripts/enable-auth-leaked-password-protection.mjs
 */

const PROJECT_REF = "vthfrxehrursfloevnlp";
const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();

if (!token) {
  console.error(
    "Set SUPABASE_ACCESS_TOKEN (Personal Access Token from https://supabase.com/dashboard/account/tokens)",
  );
  process.exit(1);
}

const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`;

const res = await fetch(url, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ password_hibp_enabled: true }),
});

if (!res.ok) {
  const text = await res.text();
  console.error("Supabase API error:", res.status, text);
  process.exit(1);
}

const data = await res.json().catch(() => ({}));
console.log("Auth config updated:");
console.log("  password_hibp_enabled:", data?.password_hibp_enabled ?? true);

if (data?.password_hibp_enabled === false) {
  console.error("Supabase returned password_hibp_enabled=false.");
  process.exit(1);
}

console.log("Leaked password protection enabled successfully.");
