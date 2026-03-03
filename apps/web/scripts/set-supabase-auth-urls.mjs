#!/usr/bin/env node
/**
 * Set Supabase Auth Site URL and Redirect URLs via Management API.
 * Requires: SUPABASE_ACCESS_TOKEN (Personal Access Token from https://supabase.com/dashboard/account/tokens)
 * Usage: SUPABASE_ACCESS_TOKEN=xxx node scripts/set-supabase-auth-urls.mjs [site_url]
 *   site_url defaults to https://aistroyka-web-dev.z6pxn548dk.workers.dev
 */

const PROJECT_REF = "vthfrxehrursfloevnlp";
const DEV_URL = "https://aistroyka-web-dev.z6pxn548dk.workers.dev";
const PROD_URL = "https://aistroyka-web-production.z6pxn548dk.workers.dev";
const CUSTOM_DOMAIN = "https://aistroyka.ai";

const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token?.trim()) {
  console.error("Set SUPABASE_ACCESS_TOKEN (Personal Access Token from https://supabase.com/dashboard/account/tokens)");
  process.exit(1);
}

const siteUrl = process.argv[2]?.trim() || CUSTOM_DOMAIN;
const urlsForList = [DEV_URL, PROD_URL, CUSTOM_DOMAIN, "https://www.aistroyka.ai"];
const uriAllowList = urlsForList.flatMap((u) => [u, `${u}/**`, `${u}/*`]).join(",");

const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`;
const res = await fetch(url, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    site_url: siteUrl,
    uri_allow_list: uriAllowList,
  }),
});

if (!res.ok) {
  const text = await res.text();
  console.error("Supabase API error:", res.status, text);
  process.exit(1);
}

const data = await res.json().catch(() => ({}));
console.log("Auth URL config updated:");
console.log("  site_url:", data?.site_url ?? siteUrl);
console.log("  redirect URLs (uri_allow_list):", data?.uri_allow_list ?? uriAllowList);
