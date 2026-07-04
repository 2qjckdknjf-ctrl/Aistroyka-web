#!/usr/bin/env node
/**
 * Read-only audit: Cloudflare Access policy for admin.aistroyka.ai
 *
 * Usage:
 *   cd apps/web && node scripts/cf-admin-domain-access-audit.mjs
 *
 * Requires CLOUDFLARE_ACCESS_API_TOKEN in env or .env.cf
 * Prints masked emails only — never log raw operator addresses in CI artifacts.
 */

import fs from "node:fs";
import path from "node:path";

const API = "https://api.cloudflare.com/client/v4";
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID?.trim() ?? "864f04d729c24f574a228558b40d7b82";
const ADMIN_HOST = "admin.aistroyka.ai";
const APP_NAME = "AISTROYKA Platform Admin";

function loadToken() {
  const access = process.env.CLOUDFLARE_ACCESS_API_TOKEN?.trim();
  if (access) return access;
  try {
    const envPath = path.join(process.cwd(), ".env.cf");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      const accessMatch = content.match(/CLOUDFLARE_ACCESS_API_TOKEN\s*=\s*(\S+)/);
      if (accessMatch) return accessMatch[1].trim();
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

function maskEmail(email) {
  if (!email || !email.includes("@")) return "(redacted)";
  const [local, domain] = email.split("@");
  return `${local.slice(0, 2)}***@${domain}`;
}

function summarizeRules(rules) {
  if (!Array.isArray(rules) || rules.length === 0) return [];
  return rules.map((rule) => {
    if (rule.email?.email) return { type: "email", value: maskEmail(rule.email.email) };
    if (rule.everyone) return { type: "everyone", value: true };
    if (rule.group?.name) return { type: "group", value: rule.group.name };
    if (rule.any_valid_service_token) return { type: "service_token", value: true };
    if (rule.ip) return { type: "ip", value: rule.ip };
    return { type: "other", value: rule };
  });
}

async function cf(token, apiPath) {
  const res = await fetch(`${API}${apiPath}`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  const json = await res.json();
  return { status: res.status, json };
}

async function main() {
  const token = loadToken();
  if (!token) throw new Error("CLOUDFLARE_ACCESS_API_TOKEN required");

  const list = await cf(token, `/accounts/${ACCOUNT_ID}/access/apps`);
  if (!list.json.success) {
    console.error("LIST apps failed", list.status, list.json.errors);
    process.exit(1);
  }

  const apps = (list.json.result ?? []).filter((a) => {
    const domain = a.domain ?? "";
    const hosted = a.self_hosted_domains ?? [];
    return domain === ADMIN_HOST || hosted.includes(ADMIN_HOST);
  });

  if (apps.length !== 1) {
    console.error("AUDIT_FAIL unexpected_admin_host_app_count", apps.length);
    process.exit(1);
  }

  const app = apps[0];
  const policies = await cf(token, `/accounts/${ACCOUNT_ID}/access/apps/${app.id}/policies`);
  if (!policies.json.success) {
    console.error("LIST policies failed", policies.json.errors);
    process.exit(1);
  }

  const rows = policies.json.result ?? [];
  const allowPolicies = rows.filter((p) => p.decision === "allow");
  const bypassPolicies = rows.filter((p) => p.decision === "bypass" || p.decision === "non_identity");

  const allowedEmails = [];
  for (const p of allowPolicies) {
    for (const rule of p.include ?? []) {
      if (rule.email?.email) allowedEmails.push(maskEmail(rule.email.email));
    }
  }

  const report = {
    appId: app.id,
    appName: app.name,
    domain: app.domain ?? app.self_hosted_domains,
    sessionDuration: app.session_duration,
    policyCount: rows.length,
    allowPolicyCount: allowPolicies.length,
    bypassPolicyCount: bypassPolicies.length,
    allowedEmailsMasked: allowedEmails,
    policies: rows.map((p) => ({
      name: p.name,
      decision: p.decision,
      precedence: p.precedence,
      include: summarizeRules(p.include),
      exclude: summarizeRules(p.exclude),
    })),
    ownerOnly:
      bypassPolicies.length === 0 &&
      allowPolicies.length === 1 &&
      allowedEmails.length === 1 &&
      !rows.some((p) => (p.include ?? []).some((r) => r.everyone)),
  };

  console.log(JSON.stringify(report, null, 2));
  process.exit(report.ownerOnly ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
