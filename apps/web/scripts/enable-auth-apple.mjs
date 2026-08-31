#!/usr/bin/env node
/**
 * Enable Supabase Auth Apple provider from a Sign in with Apple .p8 key.
 * Requires: SUPABASE_ACCESS_TOKEN
 * Optional env (defaults match live AISTROYKA team):
 *   APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_SERVICES_ID, APPLE_P8_PATH
 *   APPLE_ADDITIONAL_CLIENT_IDS (comma-separated bundle IDs)
 *
 * Does not print the JWT or .p8. Does not invent Apple keys.
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=xxx APPLE_P8_PATH=local-secrets/apple/AuthKey_….p8 \
 *     node apps/web/scripts/enable-auth-apple.mjs
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const PROJECT_REF = "vthfrxehrursfloevnlp";
const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
const teamId = process.env.APPLE_TEAM_ID?.trim() || "43A4KW5BKB";
const keyId = process.env.APPLE_KEY_ID?.trim() || "P9MW477G96";
const servicesId = process.env.APPLE_SERVICES_ID?.trim() || "ai.aistroyka.web";
const additional = process.env.APPLE_ADDITIONAL_CLIENT_IDS?.trim()
  || "ai.aistroyka.worker,ai.aistroyka.manager";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const keyPath = process.env.APPLE_P8_PATH?.trim()
  || path.join(repoRoot, "local-secrets/apple/AuthKey_P9MW477G96.p8");

if (!token) {
  console.error(
    "Set SUPABASE_ACCESS_TOKEN (Personal Access Token from https://supabase.com/dashboard/account/tokens)",
  );
  process.exit(1);
}
if (!fs.existsSync(keyPath)) {
  console.error("Sign in with Apple .p8 not found. Set APPLE_P8_PATH.");
  process.exit(1);
}

function appleClientSecret({ privateKeyPem, kid, teamId, servicesId }) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "ES256", kid })).toString("base64url");
  const body = Buffer.from(JSON.stringify({
    iss: teamId,
    iat: now,
    exp: now + 86400 * 180,
    aud: "https://appleid.apple.com",
    sub: servicesId,
  })).toString("base64url");
  const data = `${header}.${body}`;
  const key = crypto.createPrivateKey(privateKeyPem);
  const sig = crypto.sign("sha256", Buffer.from(data), { key, dsaEncoding: "ieee-p1363" });
  return `${data}.${sig.toString("base64url")}`;
}

const secret = appleClientSecret({
  privateKeyPem: fs.readFileSync(keyPath, "utf8"),
  kid: keyId,
  teamId,
  servicesId,
});

const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`;
const res = await fetch(url, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  body: JSON.stringify({
    external_apple_enabled: true,
    external_apple_client_id: `${servicesId},${additional}`,
    external_apple_secret: secret,
  }),
});

if (!res.ok) {
  console.error("Supabase API error:", res.status, await res.text());
  process.exit(1);
}

const data = await res.json().catch(() => ({}));
console.log("Auth config updated:");
console.log("  external_apple_enabled:", data?.external_apple_enabled);
console.log("  apple_client_set:", Boolean(data?.external_apple_client_id));
console.log("  apple_secret_set:", Boolean(data?.external_apple_secret));
console.log("  services_id:", servicesId);
if (data?.external_apple_enabled !== true) {
  console.error("Apple provider is still off.");
  process.exit(1);
}
