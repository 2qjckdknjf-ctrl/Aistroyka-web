#!/usr/bin/env node
/**
 * Merge Supabase Auth Site URL and Redirect URLs via Management API.
 * Requires: SUPABASE_ACCESS_TOKEN (Personal Access Token from https://supabase.com/dashboard/account/tokens)
 * Usage: SUPABASE_ACCESS_TOKEN=xxx node scripts/set-supabase-auth-urls.mjs [site_url]
 *   site_url defaults to https://aistroyka.ai
 *
 * Always MERGES with the live allow-list so iOS custom schemes are not wiped.
 */

const PROJECT_REF = "vthfrxehrursfloevnlp";
const DEV_URL = "https://aistroyka-web-dev.z6pxn548dk.workers.dev";
const PROD_URL = "https://aistroyka-web-production.z6pxn548dk.workers.dev";
const CUSTOM_DOMAIN = "https://aistroyka.ai";
const WWW_DOMAIN = "https://www.aistroyka.ai";
const STAGING_DOMAIN = "https://staging.aistroyka.ai";

const REQUIRED_REDIRECTS = [
  DEV_URL,
  `${DEV_URL}/**`,
  `${DEV_URL}/*`,
  PROD_URL,
  `${PROD_URL}/**`,
  `${PROD_URL}/*`,
  CUSTOM_DOMAIN,
  `${CUSTOM_DOMAIN}/**`,
  `${CUSTOM_DOMAIN}/*`,
  `${CUSTOM_DOMAIN}/api/auth/callback`,
  WWW_DOMAIN,
  `${WWW_DOMAIN}/**`,
  `${WWW_DOMAIN}/*`,
  `${WWW_DOMAIN}/api/auth/callback`,
  STAGING_DOMAIN,
  `${STAGING_DOMAIN}/**`,
  `${STAGING_DOMAIN}/*`,
  `${STAGING_DOMAIN}/api/auth/callback`,
  "ai.aistroyka.worker://auth-callback",
  "ai.aistroyka.worker://**",
  "ai.aistroyka.manager://auth-callback",
  "ai.aistroyka.manager://**",
];

const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token?.trim()) {
  console.error("Set SUPABASE_ACCESS_TOKEN (Personal Access Token from https://supabase.com/dashboard/account/tokens)");
  process.exit(1);
}

const siteUrl = process.argv[2]?.trim() || CUSTOM_DOMAIN;
const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`;
const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  Accept: "application/json",
};

const currentRes = await fetch(url, { headers });
if (!currentRes.ok) {
  console.error("Supabase API GET error:", currentRes.status, await currentRes.text());
  process.exit(1);
}
const current = await currentRes.json();
const existing = String(current.uri_allow_list || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const merged = [];
const seen = new Set();
for (const entry of [...existing, ...REQUIRED_REDIRECTS]) {
  if (!seen.has(entry)) {
    seen.add(entry);
    merged.push(entry);
  }
}

const res = await fetch(url, {
  method: "PATCH",
  headers,
  body: JSON.stringify({
    site_url: siteUrl,
    uri_allow_list: merged.join(","),
  }),
});

if (!res.ok) {
  const text = await res.text();
  console.error("Supabase API error:", res.status, text);
  process.exit(1);
}

const data = await res.json().catch(() => ({}));
const allow = String(data?.uri_allow_list ?? merged.join(","));
console.log("Auth URL config updated:");
console.log("  site_url:", data?.site_url ?? siteUrl);
console.log("  redirect count:", allow.split(",").filter(Boolean).length);
console.log("  worker callback:", allow.includes("ai.aistroyka.worker://auth-callback"));
console.log("  manager callback:", allow.includes("ai.aistroyka.manager://auth-callback"));
