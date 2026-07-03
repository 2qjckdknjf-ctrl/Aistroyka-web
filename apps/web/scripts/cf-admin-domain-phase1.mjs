#!/usr/bin/env node
/**
 * Phase 1: admin.aistroyka.ai infrastructure (DNS/route/custom domain + Cloudflare Access).
 *
 * Requires CLOUDFLARE_API_TOKEN with:
 * - Account:Workers Scripts:Edit
 * - Zone:DNS:Edit (zone aistroyka.ai)
 * - Zone:Workers Routes:Edit OR account workers services routes write
 * - Account:Access: Apps and Policies:Edit (Zero Trust)
 *
 * Usage (from apps/web):
 *   CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... node scripts/cf-admin-domain-phase1.mjs
 *   CLOUDFLARE_ACCESS_OPERATOR_EMAILS=ops@example.com,owner@example.com node scripts/cf-admin-domain-phase1.mjs
 *
 * Phase 1 does NOT set OWNER_ALLOWED_HOSTS on the Worker.
 */

import fs from "node:fs";
import path from "node:path";

const API = "https://api.cloudflare.com/client/v4";
const ZONE_NAME = "aistroyka.ai";
const ADMIN_HOST = "admin.aistroyka.ai";
const WORKER_SERVICE = "aistroyka-web-production";
const WORKER_ENV = "production";

function loadTokenFromEnvFile() {
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

function loadToken() {
  const fromEnv = process.env.CLOUDFLARE_API_TOKEN?.trim();
  if (fromEnv) return fromEnv;
  return loadTokenFromEnvFile();
}

async function cf(path, { method = "GET", body } = {}) {
  const token = loadToken();
  if (!token) throw new Error("CLOUDFLARE_API_TOKEN missing");
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const res = await fetch(`${API}${path}`, {
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

async function main() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  if (!accountId) {
    console.error("Set CLOUDFLARE_ACCOUNT_ID");
    process.exit(1);
  }

  console.log("=== Phase 1 admin domain infrastructure ===");
  console.log("Target:", ADMIN_HOST);
  console.log("Worker:", WORKER_SERVICE);

  const zones = await cf(`/zones?name=${ZONE_NAME}`);
  if (!zones.json.success || !zones.json.result?.[0]) {
    console.error("Zone lookup failed:", zones.json);
    process.exit(1);
  }
  const zoneId = zones.json.result[0].id;
  console.log("Zone ID:", zoneId);

  const routesPath = `/accounts/${accountId}/workers/services/${WORKER_SERVICE}/environments/${WORKER_ENV}/routes`;
  const routesBefore = await cf(routesPath);
  console.log("\n--- Current worker routes ---");
  if (routesBefore.json.success) {
    for (const r of routesBefore.json.result ?? []) {
      console.log(`  ${r.pattern} -> ${r.script}`);
    }
  } else {
    console.log("  (cannot read routes)", routesBefore.json.errors);
  }

  const hasAdminRoute = (routesBefore.json.result ?? []).some((r) =>
    String(r.pattern).includes(ADMIN_HOST)
  );

  if (!hasAdminRoute) {
    console.log("\n--- Adding worker route ---");
    const addRoute = await cf(routesPath, {
      method: "POST",
      body: { pattern: `${ADMIN_HOST}/*`, zone_name: ZONE_NAME },
    });
    if (!addRoute.json.success) {
      console.error("FAILED to add route:", addRoute.json.errors);
      console.error("Token likely needs Workers Routes write. Use Dashboard or upgrade token.");
    } else {
      console.log("OK route added:", addRoute.json.result?.pattern ?? ADMIN_HOST);
    }
  } else {
    console.log("\nAdmin route already present — skip add.");
  }

  const domainsPath = `/accounts/${accountId}/workers/services/${WORKER_SERVICE}/environments/${WORKER_ENV}/domains`;
  console.log("\n--- Custom domain (optional, preferred over route) ---");
  const domains = await cf(domainsPath);
  const hasDomain = (domains.json.result ?? []).some((d) => d.hostname === ADMIN_HOST);
  if (!hasDomain) {
    const addDomain = await cf(domainsPath, {
      method: "POST",
      body: { hostname: ADMIN_HOST, zone_id: zoneId },
    });
    if (!addDomain.json.success) {
      console.log("Custom domain POST not applied (route fallback may suffice):", addDomain.json.errors);
    } else {
      console.log("OK custom domain:", ADMIN_HOST);
    }
  } else {
    console.log("Custom domain already present.");
  }

  const operatorEmails = (process.env.CLOUDFLARE_ACCESS_OPERATOR_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  console.log("\n--- Cloudflare Access application ---");
  const apps = await cf(`/accounts/${accountId}/access/apps`);
  if (!apps.json.success) {
    console.error("FAILED to list Access apps (need Zero Trust permissions):", apps.json.errors);
  } else {
    const existing = (apps.json.result ?? []).find((a) =>
      (a.domain ?? a.self_hosted_domains ?? []).includes?.(ADMIN_HOST) ||
      a.name === "AISTROYKA Platform Admin"
    );
    if (existing) {
      console.log("Access app exists:", existing.name, existing.id);
    } else if (operatorEmails.length === 0) {
      console.log("Skip Access create — set CLOUDFLARE_ACCESS_OPERATOR_EMAILS to create allow policy.");
    } else {
      const createApp = await cf(`/accounts/${accountId}/access/apps`, {
        method: "POST",
        body: {
          name: "AISTROYKA Platform Admin",
          type: "self_hosted",
          session_duration: "8h",
          auto_redirect_to_identity: true,
          allowed_idps: [],
          domain: ADMIN_HOST,
          self_hosted_domains: [ADMIN_HOST],
        },
      });
      if (!createApp.json.success) {
        console.error("FAILED to create Access app:", createApp.json.errors);
      } else {
        const appId = createApp.json.result?.id;
        console.log("OK Access app created:", appId);
        const policy = await cf(`/accounts/${accountId}/access/apps/${appId}/policies`, {
          method: "POST",
          body: {
            name: "Platform operators",
            decision: "allow",
            include: operatorEmails.map((email) => ({ email: { email } })),
            precedence: 1,
          },
        });
        if (!policy.json.success) {
          console.error("FAILED to create Access policy:", policy.json.errors);
        } else {
          console.log("OK Access allow policy for", operatorEmails.join(", "));
          console.log("Enable MFA on the policy in Zero Trust dashboard (API MFA flags vary by plan).");
        }
      }
    }
  }

  console.log("\n--- Post-check (external DNS may take minutes) ---");
  console.log("Run:");
  console.log(`  dig +short ${ADMIN_HOST}`);
  console.log(`  curl -sI https://${ADMIN_HOST}/`);
  console.log(`  curl -s https://aistroyka.ai/api/v1/health | jq .buildStamp.sha7`);
  console.log("\nOWNER_ALLOWED_HOSTS: NOT SET (Phase 3 only).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
