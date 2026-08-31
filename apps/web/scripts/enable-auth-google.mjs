#!/usr/bin/env node
/**
 * Enable Supabase Auth Google provider from env credentials.
 * Requires:
 *   SUPABASE_ACCESS_TOKEN
 *   GOOGLE_OAUTH_CLIENT_ID
 *   GOOGLE_OAUTH_CLIENT_SECRET
 *
 * Does not print secrets. Does not invent Google Cloud clients.
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=xxx GOOGLE_OAUTH_CLIENT_ID=xxx GOOGLE_OAUTH_CLIENT_SECRET=xxx \
 *     node apps/web/scripts/enable-auth-google.mjs
 */

const PROJECT_REF = "vthfrxehrursfloevnlp";
const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();

if (!token) {
  console.error(
    "Set SUPABASE_ACCESS_TOKEN (Personal Access Token from https://supabase.com/dashboard/account/tokens)",
  );
  process.exit(1);
}
if (!clientId || !clientSecret) {
  console.error("Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET (Web application OAuth client).");
  process.exit(1);
}

const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`;
const res = await fetch(url, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  body: JSON.stringify({
    external_google_enabled: true,
    external_google_client_id: clientId,
    external_google_secret: clientSecret,
  }),
});

if (!res.ok) {
  console.error("Supabase API error:", res.status, await res.text());
  process.exit(1);
}

const data = await res.json().catch(() => ({}));
console.log("Auth config updated:");
console.log("  external_google_enabled:", data?.external_google_enabled);
console.log("  google_client_set:", Boolean(data?.external_google_client_id));
console.log("  google_secret_set:", Boolean(data?.external_google_secret));
if (data?.external_google_enabled !== true) {
  console.error("Google provider is still off.");
  process.exit(1);
}
