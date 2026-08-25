#!/usr/bin/env node
/**
 * Enable Supabase Auth phone provider for Worker SMS OTP.
 * Requires: SUPABASE_ACCESS_TOKEN (PAT from https://supabase.com/dashboard/account/tokens)
 * Twilio/MessageBird credentials must already be set in the Auth dashboard —
 * this script only flips the phone provider on. It does not invent SMS secrets.
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=xxx node apps/web/scripts/enable-auth-phone-otp.mjs
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
  body: JSON.stringify({ external_phone_enabled: true }),
});

if (!res.ok) {
  const text = await res.text();
  console.error("Supabase API error:", res.status, text);
  process.exit(1);
}

const data = await res.json().catch(() => ({}));
console.log("Auth config updated:");
console.log("  external_phone_enabled:", data?.external_phone_enabled);
if (data?.external_phone_enabled !== true) {
  console.error("Phone provider is still off. Add an SMS provider in Auth settings, then rerun.");
  process.exit(1);
}
console.log("Phone OTP provider flag is on. SMS still needs a configured provider (Twilio or MessageBird).");
