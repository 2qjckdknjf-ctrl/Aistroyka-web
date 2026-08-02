/**
 * Phase 3C stakeholder credential preflight — presence only, never prints values.
 * Exit 0 = ready for authenticated Playwright.
 * Exit 2 = BLOCKED_EXTERNAL (missing stakeholder pair / base URL / project id).
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../../..");
const webRoot = path.resolve(__dirname, "../..");

const KEYS = [
  "QA_CLIENT_EMAIL",
  "QA_CLIENT_PASSWORD",
  "STAKEHOLDER_SMOKE_EMAIL",
  "STAKEHOLDER_SMOKE_PASSWORD",
  "PLAYWRIGHT_BASE_URL",
  "STAKEHOLDER_FINANCE_BASE_URL",
  "E2E_PROJECT_ID",
];

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const out = {};
  const text = readFileSync(filePath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (val) out[key] = val;
  }
  return out;
}

function mergeEnv() {
  const files = [
    path.join(repoRoot, ".env.local"),
    path.join(webRoot, ".env.local"),
    path.join(repoRoot, ".env.pilot"),
    path.join(webRoot, ".env.pilot"),
  ];
  const merged = { ...process.env };
  for (const f of files) {
    Object.assign(merged, loadEnvFile(f));
  }
  return merged;
}

function present(env, key) {
  const v = env[key];
  return typeof v === "string" && v.trim().length > 0;
}

const env = mergeEnv();
for (const k of KEYS) {
  console.log(`${k}: ${present(env, k) ? "PRESENT" : "MISSING"}`);
}

const clientPair =
  present(env, "QA_CLIENT_EMAIL") && present(env, "QA_CLIENT_PASSWORD");
const smokePair =
  present(env, "STAKEHOLDER_SMOKE_EMAIL") && present(env, "STAKEHOLDER_SMOKE_PASSWORD");
const base = present(env, "PLAYWRIGHT_BASE_URL") || present(env, "STAKEHOLDER_FINANCE_BASE_URL");
const projectId = present(env, "E2E_PROJECT_ID");

if (!base) {
  console.log("PREFLIGHT_BLOCKED: PLAYWRIGHT_BASE_URL / STAKEHOLDER_FINANCE_BASE_URL MISSING.");
  process.exit(2);
}

if (!clientPair && !smokePair) {
  console.log(
    "PREFLIGHT_BLOCKED: no complete stakeholder credential pair (QA_CLIENT_* or STAKEHOLDER_SMOKE_*)."
  );
  process.exit(2);
}

if (!projectId) {
  console.log("PREFLIGHT_BLOCKED: E2E_PROJECT_ID MISSING (required for project-detail proof).");
  process.exit(2);
}

console.log(
  "PREFLIGHT_OK: stakeholder pair + E2E_PROJECT_ID PRESENT. Runtime role/tenant must still be verified."
);
process.exit(0);
