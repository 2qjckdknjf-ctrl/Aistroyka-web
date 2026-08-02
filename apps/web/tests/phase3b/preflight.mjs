/**
 * Phase 3B credential preflight — presence only, never prints values.
 * Exit 0 = ready for authenticated Playwright.
 * Exit 2 = BLOCKED_EXTERNAL (missing personas / incomplete pairs).
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../../..");
const webRoot = path.resolve(__dirname, "../..");

const KEYS = [
  "QA_OWNER_EMAIL",
  "QA_OWNER_PASSWORD",
  "QA_MANAGER_EMAIL",
  "QA_MANAGER_PASSWORD",
  "QA_WORKER_EMAIL",
  "QA_WORKER_PASSWORD",
  "E2E_EMAIL",
  "E2E_PASSWORD",
  "E2E_USER_EMAIL",
  "E2E_USER_PASSWORD",
  "E2E_PROJECT_ID",
  "PLAYWRIGHT_BASE_URL",
  "PILOT_E2E_BASE_URL",
  "PILOT_E2E_EMAIL",
  "PILOT_E2E_PASSWORD",
];

function loadEnvFile(filePath) {
  const out = {};
  if (!existsSync(filePath)) return out;
  const text = readFileSync(filePath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim().replace(/^export\s+/, "");
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (val) out[key] = val;
  }
  return out;
}

function present(env, key) {
  const v = env[key];
  return typeof v === "string" && v.trim().length > 0;
}

function pair(env, emailKey, passwordKey) {
  return present(env, emailKey) && present(env, passwordKey);
}

const env = {
  ...loadEnvFile(path.join(repoRoot, ".env.local")),
  ...loadEnvFile(path.join(webRoot, ".env.local")),
  ...loadEnvFile(path.join(repoRoot, ".env.pilot")),
  ...process.env,
};

console.log("Phase 3B credential preflight (PRESENT/MISSING only):");
for (const key of KEYS) {
  console.log(`  ${key}: ${present(env, key) ? "PRESENT" : "MISSING"}`);
}

const adminCapable =
  pair(env, "QA_OWNER_EMAIL", "QA_OWNER_PASSWORD") ||
  pair(env, "E2E_USER_EMAIL", "E2E_USER_PASSWORD") ||
  pair(env, "E2E_EMAIL", "E2E_PASSWORD") ||
  pair(env, "PILOT_E2E_EMAIL", "PILOT_E2E_PASSWORD");

const nonAdmin =
  pair(env, "QA_MANAGER_EMAIL", "QA_MANAGER_PASSWORD") ||
  pair(env, "QA_WORKER_EMAIL", "QA_WORKER_PASSWORD");

// One incomplete E2E_EMAIL must not be reused as multiple personas.
const incompleteE2eEmailOnly = present(env, "E2E_EMAIL") && !present(env, "E2E_PASSWORD");

if (incompleteE2eEmailOnly) {
  console.log(
    "BLOCKED_EXTERNAL: E2E_EMAIL is PRESENT without E2E_PASSWORD; cannot invent a second persona from one incomplete pair."
  );
}

if (!adminCapable || !nonAdmin) {
  console.log("BLOCKED_EXTERNAL: Phase 3B requires:");
  console.log("  - one complete admin-capable credential pair");
  console.log("  - one complete authenticated non-admin credential pair");
  console.log("  - runtime role proof before counting E2E as YES");
  console.log(
    `  adminCapablePair=${adminCapable ? "yes" : "no"} nonAdminPair=${nonAdmin ? "yes" : "no"}`
  );
  process.exit(2);
}

console.log("PREFLIGHT_OK: admin-capable and non-admin credential pairs PRESENT.");
console.log("Note: runtime role mapping must still be verified before YES verdict.");
process.exit(0);
