#!/usr/bin/env node
/**
 * Validates release environment variables (names only; no secret values).
 * Run from repo root: node scripts/validate-release-env.mjs
 * Optional: set env with source apps/web/.env.local or export vars.
 * Writes reports/release-hardening/env-validation-report.md and .json
 */

import { readFileSync, mkdirSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const appsWeb = resolve(root, "apps/web");

// Load .env.local from apps/web if present (values stay in process.env; we only check presence)
function loadEnvFile(filePath) {
  try {
    const content = readFileSync(filePath, "utf8");
    const lines = content.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const eq = trimmed.indexOf("=");
        if (eq > 0) {
          const key = trimmed.slice(0, eq).trim();
          let value = trimmed.slice(eq + 1).trim();
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          if (!(key in process.env)) process.env[key] = value;
        }
      }
    }
  } catch (_) {
    // ignore missing file
  }
}

loadEnvFile(resolve(appsWeb, ".env.local"));
loadEnvFile(resolve(appsWeb, ".env"));

const ENV_SPEC = [
  { name: "NODE_ENV", category: "required_web", required: false, forbiddenInProd: false },
  { name: "NEXT_PUBLIC_SUPABASE_URL", category: "required_web", required: true, forbiddenInProd: false },
  { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", category: "required_web", required: true, forbiddenInProd: false },
  { name: "NEXT_PUBLIC_APP_URL", category: "required_web", required: true, forbiddenInProd: false },
  { name: "NODE_ENV", category: "required_web", required: true, forbiddenInProd: false },
  { name: "SUPABASE_SERVICE_ROLE_KEY", category: "required_jobs", required: true, forbiddenInProd: false },
  { name: "REQUIRE_CRON_SECRET", category: "required_jobs", required: false, forbiddenInProd: false },
  { name: "CRON_SECRET", category: "required_jobs", required: false, forbiddenInProd: false },
  { name: "OPENAI_API_KEY", category: "required_ai", required: false, forbiddenInProd: false },
  { name: "ANTHROPIC_API_KEY", category: "required_ai", required: false, forbiddenInProd: false },
  { name: "GOOGLE_AI_API_KEY", category: "required_ai", required: false, forbiddenInProd: false },
  { name: "GEMINI_API_KEY", category: "required_ai", required: false, forbiddenInProd: false },
  { name: "AI_ANALYSIS_URL", category: "required_ai", required: false, forbiddenInProd: false },
  { name: "STRIPE_SECRET_KEY", category: "required_billing", required: false, forbiddenInProd: false },
  { name: "STRIPE_WEBHOOK_SECRET", category: "required_billing", required: false, forbiddenInProd: false },
  { name: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", category: "required_billing", required: false, forbiddenInProd: false },
  { name: "FCM_PROJECT_ID", category: "required_push", required: false, forbiddenInProd: false },
  { name: "FCM_CLIENT_EMAIL", category: "required_push", required: false, forbiddenInProd: false },
  { name: "FCM_PRIVATE_KEY", category: "required_push", required: false, forbiddenInProd: false },
  { name: "APNS_KEY", category: "required_push", required: false, forbiddenInProd: false },
  { name: "APNS_KEY_ID", category: "required_push", required: false, forbiddenInProd: false },
  { name: "APNS_TEAM_ID", category: "required_push", required: false, forbiddenInProd: false },
  { name: "APNS_BUNDLE_ID", category: "required_push", required: false, forbiddenInProd: false },
  { name: "DEBUG_AUTH", category: "debug_forbidden_in_prod", required: false, forbiddenInProd: true },
  { name: "DEBUG_DIAG", category: "debug_forbidden_in_prod", required: false, forbiddenInProd: true },
  { name: "ENABLE_DIAG_ROUTES", category: "debug_forbidden_in_prod", required: false, forbiddenInProd: true },
  { name: "ALLOW_DEBUG_HOSTS", category: "optional", required: false, forbiddenInProd: false },
];

function getEnv(name) {
  const v = process.env[name];
  return typeof v === "string" ? v.trim() : "";
}

function isProduction() {
  return getEnv("NODE_ENV").toLowerCase() === "production";
}

function validate() {
  const prod = isProduction();
  const criticalMissing = [];
  const optionalMissing = [];
  const forbiddenInProdSet = [];

  const results = ENV_SPEC.map((spec) => {
    const value = getEnv(spec.name);
    const present = spec.name in process.env;
    const nonEmpty = value.length > 0;
    let safe = true;
    let message = present ? (nonEmpty ? "set" : "empty") : "missing";

    if (spec.required && !nonEmpty) {
      criticalMissing.push(spec.name);
      safe = false;
      message = "missing (required)";
    }
    if (spec.forbiddenInProd && prod && nonEmpty && (value === "true" || value.toLowerCase() === "true")) {
      forbiddenInProdSet.push(spec.name);
      safe = false;
      message = "must be unset or false in production";
    }
    if (!spec.required && !nonEmpty && spec.category.startsWith("required_")) {
      optionalMissing.push(spec.name);
    }

    return { name: spec.name, category: spec.category, present, nonEmpty, safe, message };
  });

  const requireCron = process.env.REQUIRE_CRON_SECRET === "true";
  const cronSecret = getEnv("CRON_SECRET");
  const cronConfigured = !requireCron || (requireCron && cronSecret.length > 0);
  if (requireCron && !cronSecret) criticalMissing.push("CRON_SECRET");

  const aiConfigured =
    getEnv("OPENAI_API_KEY").length > 0 ||
    getEnv("ANTHROPIC_API_KEY").length > 0 ||
    getEnv("GOOGLE_AI_API_KEY").length > 0 ||
    getEnv("GEMINI_API_KEY").length > 0;
  const billingConfigured = getEnv("STRIPE_SECRET_KEY").length > 0 && getEnv("STRIPE_WEBHOOK_SECRET").length > 0;
  const pushConfigured =
    (getEnv("FCM_PROJECT_ID").length > 0 && getEnv("FCM_CLIENT_EMAIL").length > 0 && getEnv("FCM_PRIVATE_KEY").length > 0) ||
    (getEnv("APNS_KEY").length > 0 &&
      getEnv("APNS_KEY_ID").length > 0 &&
      getEnv("APNS_TEAM_ID").length > 0 &&
      getEnv("APNS_BUNDLE_ID").length > 0);

  let verdict = "PASS";
  let verdictReason = "All critical env present; no forbidden flags in prod.";
  if (criticalMissing.length > 0) {
    verdict = "FAIL";
    verdictReason = `Missing critical: ${criticalMissing.join(", ")}`;
  } else if (forbiddenInProdSet.length > 0) {
    verdict = "FAIL";
    verdictReason = `Forbidden in production: ${forbiddenInProdSet.join(", ")}`;
  } else if (prod && !cronConfigured) {
    verdict = "FAIL";
    verdictReason = "Production requires REQUIRE_CRON_SECRET=true and CRON_SECRET set.";
  } else if (optionalMissing.length > 0 || !aiConfigured) {
    verdict = "PASS_WITH_WARNINGS";
    verdictReason =
      optionalMissing.length > 0
        ? `Optional not set: ${optionalMissing.slice(0, 8).join(", ")}${optionalMissing.length > 8 ? "..." : ""}`
        : "Some optional features not configured.";
  }

  return {
    isProduction: prod,
    criticalMissing,
    optionalMissing,
    forbiddenInProdSet,
    cronConfigured,
    aiConfigured,
    billingConfigured,
    pushConfigured,
    results,
    verdict,
    verdictReason,
  };
}

const report = validate();

// Human-readable markdown
const md = `# Environment validation report

**Generated:** ${new Date().toISOString()}
**NODE_ENV:** ${process.env.NODE_ENV ?? "(unset)"}
**Verdict:** ${report.verdict}

## Verdict reason

${report.verdictReason}

## Summary

| Check | Status |
|-------|--------|
| Production mode | ${report.isProduction ? "Yes" : "No"} |
| Critical missing | ${report.criticalMissing.length > 0 ? report.criticalMissing.join(", ") : "None"} |
| Forbidden in prod set | ${report.forbiddenInProdSet.length > 0 ? report.forbiddenInProdSet.join(", ") : "None"} |
| Cron configured | ${report.cronConfigured ? "Yes" : "No"} |
| AI configured | ${report.aiConfigured ? "Yes" : "No"} |
| Billing configured | ${report.billingConfigured ? "Yes" : "No"} |
| Push configured | ${report.pushConfigured ? "Yes" : "No"} |

## Per-variable (names only)

| Variable | Category | Present | Non-empty | Safe | Message |
|----------|----------|---------|-----------|------|---------|
${report.results.map((r) => `| ${r.name} | ${r.category} | ${r.present} | ${r.nonEmpty} | ${r.safe} | ${r.message} |`).join("\n")}

## Release verdict for env

- **PASS:** Safe for pilot/production (all critical set, no forbidden flags in prod).
- **PASS_WITH_WARNINGS:** Minimal run possible; optional features (AI, billing, push) not configured.
- **FAIL:** Do not deploy; fix critical missing or forbidden flags.
`;

// JSON (no secret values)
const jsonOut = {
  generated: new Date().toISOString(),
  nodeEnv: process.env.NODE_ENV ?? null,
  verdict: report.verdict,
  verdictReason: report.verdictReason,
  isProduction: report.isProduction,
  criticalMissing: report.criticalMissing,
  optionalMissing: report.optionalMissing,
  forbiddenInProdSet: report.forbiddenInProdSet,
  cronConfigured: report.cronConfigured,
  aiConfigured: report.aiConfigured,
  billingConfigured: report.billingConfigured,
  pushConfigured: report.pushConfigured,
  results: report.results,
};

const reportsDir = resolve(root, "reports/release-hardening");
mkdirSync(reportsDir, { recursive: true });
writeFileSync(resolve(reportsDir, "env-validation-report.md"), md);
writeFileSync(resolve(reportsDir, "env-validation-report.json"), JSON.stringify(jsonOut, null, 2));

console.log("Verdict:", report.verdict);
console.log(report.verdictReason);
console.log("Report written to reports/release-hardening/env-validation-report.md and .json");
process.exit(report.verdict === "FAIL" ? 1 : 0);
