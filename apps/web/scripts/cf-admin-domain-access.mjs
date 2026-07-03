#!/usr/bin/env node
/**
 * Create Cloudflare Access application for admin.aistroyka.ai
 *
 * Requires API token with: Account → Access: Apps and Policies → Edit
 * Set CLOUDFLARE_ACCESS_API_TOKEN (preferred) or CLOUDFLARE_API_TOKEN in env / .env.cf
 *
 * Usage:
 *   CLOUDFLARE_ACCESS_OPERATOR_EMAILS=ops@example.com,owner@example.com \
 *   node scripts/cf-admin-domain-access.mjs
 */

import fs from "node:fs";
import path from "node:path";

const API = "https://api.cloudflare.com/client/v4";
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID?.trim() ?? "864f04d729c24f574a228558b40d7b82";
const ADMIN_HOST = "admin.aistroyka.ai";
const APP_NAME = "AISTROYKA Platform Admin";
const DEFAULT_OPERATOR = "z6pxn548dk@privaterelay.appleid.com";

function loadToken() {
  const access = process.env.CLOUDFLARE_ACCESS_API_TOKEN?.trim();
  if (access) return access;
  const main = process.env.CLOUDFLARE_API_TOKEN?.trim();
  if (main) return main;
  try {
    const envPath = path.join(process.cwd(), ".env.cf");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      const accessMatch = content.match(/CLOUDFLARE_ACCESS_API_TOKEN\s*=\s*(\S+)/);
      if (accessMatch) return accessMatch[1].trim();
      const mainMatch = content.match(/CLOUDFLARE_API_TOKEN\s*=\s*(\S+)/);
      if (mainMatch) return mainMatch[1].trim();
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

async function cf(apiPath, { method = "GET", body } = {}) {
  const token = loadToken();
  if (!token) throw new Error("CLOUDFLARE_ACCESS_API_TOKEN or CLOUDFLARE_API_TOKEN required");
  const res = await fetch(`${API}${apiPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  return { status: res.status, json };
}

function operatorEmails() {
  const raw = process.env.CLOUDFLARE_ACCESS_OPERATOR_EMAILS?.trim();
  if (raw) {
    return raw.split(",").map((e) => e.trim()).filter(Boolean);
  }
  return [DEFAULT_OPERATOR];
}

async function main() {
  console.log("=== Cloudflare Access: AISTROYKA Platform Admin ===");
  console.log("Domain:", ADMIN_HOST);

  const list = await cf(`/accounts/${ACCOUNT_ID}/access/apps`);
  if (!list.json.success) {
    console.error("LIST apps failed HTTP", list.status, list.json.errors);
    console.error("Blocker: token needs Account → Access: Apps and Policies → Edit");
    process.exit(1);
  }

  const existing = (list.json.result ?? []).find(
    (a) =>
      a.name === APP_NAME ||
      a.domain === ADMIN_HOST ||
      (Array.isArray(a.self_hosted_domains) && a.self_hosted_domains.includes(ADMIN_HOST))
  );

  let appId = existing?.id;
  if (existing) {
    console.log("App exists:", existing.name, existing.id);
  } else {
    const create = await cf(`/accounts/${ACCOUNT_ID}/access/apps`, {
      method: "POST",
      body: {
        name: APP_NAME,
        type: "self_hosted",
        domain: ADMIN_HOST,
        session_duration: "8h",
        auto_redirect_to_identity: true,
        mfa_config: {
          allowed_authenticators: ["totp", "security_key"],
          mfa_disabled: false,
          session_duration: "8h",
        },
      },
    });
    if (!create.json.success) {
      console.error("CREATE app failed HTTP", create.status, create.json.errors);
      process.exit(1);
    }
    appId = create.json.result?.id;
    console.log("Created app:", appId);
  }

  const policies = await cf(`/accounts/${ACCOUNT_ID}/access/apps/${appId}/policies`);
  if (!policies.json.success) {
    console.error("LIST policies failed", policies.json.errors);
    process.exit(1);
  }

  const emails = operatorEmails();
  const hasAllow = (policies.json.result ?? []).some((p) =>
    p.name === "Platform operators" && p.decision === "allow"
  );

  if (!hasAllow) {
    const policy = await cf(`/accounts/${ACCOUNT_ID}/access/apps/${appId}/policies`, {
      method: "POST",
      body: {
        name: "Platform operators",
        decision: "allow",
        include: emails.map((email) => ({ email: { email } })),
        precedence: 1,
        mfa_config: {
          allowed_authenticators: ["totp", "security_key"],
          mfa_disabled: false,
          session_duration: "8h",
        },
      },
    });
    if (!policy.json.success) {
      console.error("CREATE policy failed HTTP", policy.status, policy.json.errors);
      process.exit(1);
    }
    console.log("Created allow policy for:", emails.join(", "));
  } else {
    console.log("Allow policy already present");
  }

  console.log("\nValidate:");
  console.log(`  curl -sI --resolve ${ADMIN_HOST}:443:188.114.96.5 https://${ADMIN_HOST}/ | head`);
  console.log("Expect redirect to Cloudflare Access login.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
