#!/usr/bin/env node
/**
 * Release readiness check: env, debug safety, cron, build, tests, optional config.
 * Run from repo root: node scripts/release-readiness-check.mjs
 * Writes reports/release-hardening/release-readiness-check.json and .md
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const appsWeb = resolve(root, "apps/web");

function loadEnv() {
  const tryLoad = (p) => {
    if (!existsSync(p)) return;
    const c = readFileSync(p, "utf8");
    for (const line of c.split("\n")) {
      const t = line.trim();
      if (t && !t.startsWith("#") && t.includes("=")) {
        const eq = t.indexOf("=");
        const k = t.slice(0, eq).trim();
        const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
        if (!(k in process.env)) process.env[k] = v;
      }
    }
  };
  tryLoad(resolve(appsWeb, ".env.local"));
  tryLoad(resolve(appsWeb, ".env"));
}

loadEnv();

const getEnv = (name) => (process.env[name] ?? "").trim();
const isProd = () => getEnv("NODE_ENV").toLowerCase() === "production";

const checks = [];
let failCount = 0;
let warnCount = 0;

function pass(name, message) {
  checks.push({ name, status: "PASS", message });
}
function warn(name, message) {
  checks.push({ name, status: "WARN", message });
  warnCount++;
}
function fail(name, message) {
  checks.push({ name, status: "FAIL", message });
  failCount++;
}

// 1. Required env presence
const required = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"];
for (const k of required) {
  if (getEnv(k).length > 0) pass(`env_${k}`, "set");
  else fail(`env_${k}`, "missing");
}

// 2. Debug flags safe in production
if (isProd()) {
  const debugAuth = getEnv("DEBUG_AUTH") === "true";
  const debugDiag = getEnv("DEBUG_DIAG") === "true";
  const enableDiag = getEnv("ENABLE_DIAG_ROUTES") === "true";
  const allowlist = getEnv("ALLOW_DEBUG_HOSTS");
  if (debugAuth || debugDiag || enableDiag) {
    if (allowlist.length > 0) warn("debug_surface", "Debug enabled but ALLOW_DEBUG_HOSTS set");
    else fail("debug_surface", "Debug/diag enabled in production without ALLOW_DEBUG_HOSTS");
  } else {
    pass("debug_surface", "No debug flags in production");
  }
} else {
  pass("debug_surface", "Not production");
}

// 3. Cron protection
const requireCron = process.env.REQUIRE_CRON_SECRET === "true";
const cronSecret = getEnv("CRON_SECRET");
if (isProd()) {
  if (requireCron && cronSecret.length > 0) pass("cron_config", "REQUIRE_CRON_SECRET and CRON_SECRET set");
  else if (requireCron) fail("cron_config", "REQUIRE_CRON_SECRET=true but CRON_SECRET missing");
  else warn("cron_config", "Production should set REQUIRE_CRON_SECRET=true and CRON_SECRET");
} else {
  pass("cron_config", "N/A (not production)");
}

// 4. Build scripts
const pkgRoot = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
if (pkgRoot.scripts?.build) pass("build_script", "Root build exists");
else fail("build_script", "No root build script");
const pkgWeb = existsSync(resolve(appsWeb, "package.json")) ? JSON.parse(readFileSync(resolve(appsWeb, "package.json"), "utf8")) : {};
if (pkgWeb.scripts?.build) pass("web_build_script", "Web build exists");
else fail("web_build_script", "No web build script");

// 5. Tests
if (pkgWeb.scripts?.test) pass("test_script", "Web test script exists");
else fail("test_script", "No web test script");

// 6. Storage checklist (placeholder)
warn("storage_checklist", "CONFIG-REQUIRED: Validate Supabase storage bucket policies per STORAGE_AND_MEDIA_READINESS.md");

// 7. Stripe
const stripeSecret = getEnv("STRIPE_SECRET_KEY");
const stripeWebhook = getEnv("STRIPE_WEBHOOK_SECRET");
if (stripeSecret.length > 0 && stripeWebhook.length > 0) pass("stripe_config", "Stripe keys set");
else warn("stripe_config", "Stripe optional; not set");

// 8. AI
const ai = getEnv("OPENAI_API_KEY") || getEnv("ANTHROPIC_API_KEY") || getEnv("GOOGLE_AI_API_KEY") || getEnv("GEMINI_API_KEY");
if (ai.length > 0) pass("ai_config", "At least one AI provider key set");
else warn("ai_config", "No AI key set (optional for minimal run)");

// 9. Push
const pushFcm = getEnv("FCM_PROJECT_ID") && getEnv("FCM_CLIENT_EMAIL") && getEnv("FCM_PRIVATE_KEY");
const pushApns = getEnv("APNS_KEY") && getEnv("APNS_KEY_ID") && getEnv("APNS_TEAM_ID") && getEnv("APNS_BUNDLE_ID");
if (pushFcm || pushApns) pass("push_config", "Push (FCM or APNS) set");
else warn("push_config", "Push optional; not set");

let verdict = "PASS";
if (failCount > 0) verdict = "FAIL";
else if (warnCount > 0) verdict = "PASS_WITH_WARNINGS";

const report = {
  timestamp: new Date().toISOString(),
  verdict,
  failCount,
  warnCount,
  checks,
  isProduction: isProd(),
};

const md = `# Release readiness check

**Verdict:** ${verdict}
**Failures:** ${failCount}
**Warnings:** ${warnCount}
**Time:** ${report.timestamp}

## Checks

| Check | Status | Message |
|-------|--------|---------|
${checks.map((c) => `| ${c.name} | ${c.status} | ${c.message} |`).join("\n")}

## Next

- If FAIL: fix failing checks (env, debug, cron).
- If PASS_WITH_WARNINGS: optional features not configured; acceptable for minimal pilot.
- Run \`node scripts/validate-release-env.mjs\` for full env report.
`;

const reportsDir = resolve(root, "reports/release-hardening");
mkdirSync(reportsDir, { recursive: true });
writeFileSync(resolve(reportsDir, "release-readiness-check.json"), JSON.stringify(report, null, 2));
writeFileSync(resolve(reportsDir, "release-readiness-check.md"), md);

console.log("Verdict:", verdict);
console.log("Report: reports/release-hardening/release-readiness-check.md");
process.exit(verdict === "FAIL" ? 1 : 0);
