#!/usr/bin/env node
/**
 * Phase 1: admin.aistroyka.ai infrastructure.
 *
 * PRIMARY PATH (executed 2026-07-03): Wrangler OAuth (unset CLOUDFLARE_API_TOKEN)
 *   unset CLOUDFLARE_API_TOKEN
 *   bunx wrangler triggers deploy -c wrangler.admin-phase1.toml -e production --name aistroyka-web-production
 *
 * API token path (apps/web/.env.cf) is read-only for route/domain/DNS/Access writes (10405/10000).
 *
 * Access (Zero Trust) requires Dashboard or API token with Account → Access: Apps and Policies → Edit.
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const API = "https://api.cloudflare.com/client/v4";
const ZONE_NAME = "aistroyka.ai";
const ADMIN_HOST = "admin.aistroyka.ai";
const WORKER_SERVICE = "aistroyka-web-production";
const WORKER_ENV = "production";

function loadToken() {
  const fromEnv = process.env.CLOUDFLARE_API_TOKEN?.trim();
  if (fromEnv) return fromEnv;
  try {
    const envPath = path.join(process.cwd(), ".env.cf");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      const m = content.match(/CLOUDFLARE_API_TOKEN\s*=\s*(\S+)/);
      if (m) return m[1].trim();
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

async function cf(apiPath, { method = "GET", body, token } = {}) {
  const auth = token ?? loadToken();
  if (!auth) throw new Error("CLOUDFLARE_API_TOKEN missing");
  const res = await fetch(`${API}${apiPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${auth}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  return { status: res.status, json };
}

function deployViaWranglerOAuth() {
  console.log("\n--- Wrangler OAuth triggers deploy (preferred) ---");
  const env = { ...process.env };
  delete env.CLOUDFLARE_API_TOKEN;
  const result = spawnSync(
    "bunx",
    [
      "wrangler",
      "triggers",
      "deploy",
      "-c",
      "wrangler.admin-phase1.toml",
      "-e",
      "production",
      "--name",
      WORKER_SERVICE,
    ],
    { cwd: process.cwd(), env, stdio: "inherit" }
  );
  return result.status === 0;
}

async function main() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  if (!accountId) {
    console.error("Set CLOUDFLARE_ACCOUNT_ID");
    process.exit(1);
  }

  console.log("=== Phase 1 admin domain infrastructure ===");
  console.log("Target:", ADMIN_HOST);

  const ok = deployViaWranglerOAuth();
  if (!ok) {
    console.error("Wrangler OAuth deploy failed — ensure `wrangler whoami` shows workers_routes:write");
    process.exit(1);
  }

  const routesPath = `/accounts/${accountId}/workers/services/${WORKER_SERVICE}/environments/${WORKER_ENV}/routes`;
  const routes = await cf(routesPath);
  console.log("\n--- Worker routes ---");
  if (routes.json.success) {
    for (const r of routes.json.result ?? []) {
      console.log(`  ${r.pattern}`);
    }
  }

  const domainsPath = `/accounts/${accountId}/workers/services/${WORKER_SERVICE}/environments/${WORKER_ENV}/domains`;
  const domains = await cf(domainsPath);
  console.log("\n--- Custom domains ---");
  if (domains.json.success) {
    for (const d of domains.json.result ?? []) {
      console.log(`  ${d.hostname} enabled=${d.enabled ?? true} cert=${d.cert_id ?? "n/a"}`);
    }
  }

  const apps = await cf(`/accounts/${accountId}/access/apps`);
  if (!apps.json.success) {
    console.log("\n--- Cloudflare Access ---");
    console.log("SKIP API:", apps.json.errors);
    console.log("Create Access app in Zero Trust Dashboard for", ADMIN_HOST);
  }

  console.log("\nValidate:");
  console.log(`  dig @1.1.1.1 +short ${ADMIN_HOST}`);
  console.log(`  curl -s https://${ADMIN_HOST}/api/v1/health`);
  console.log("OWNER_ALLOWED_HOSTS: not set in Phase 1 (Phase 3 enforcement).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
