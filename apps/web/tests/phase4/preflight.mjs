/**
 * Phase 4 mobile backend contracts preflight.
 * Exit 2 = mandatory E2E impossible. Logs PRESENT/MISSING only for secrets.
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../../..");
const webRoot = path.resolve(__dirname, "../..");
const AISTROYKA_REF = "vthfrxehrursfloevnlp";

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const out = {};
  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (value) out[key] = value;
  }
  return out;
}

function mergeEnv() {
  const root = loadEnvFile(path.join(repoRoot, ".env.local"));
  const web = loadEnvFile(path.join(webRoot, ".env.local"));
  const phase4 = loadEnvFile(process.env.PHASE4_ENV_FILE || path.join("/tmp/aistroyka-phase4-orch", "phase4.env"));
  const merged = { ...process.env, ...web, ...root, ...phase4 };
  if (root.SUPABASE_SERVICE_ROLE_KEY?.includes(".")) {
    merged.SUPABASE_SERVICE_ROLE_KEY = root.SUPABASE_SERVICE_ROLE_KEY;
  }
  return merged;
}

function present(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isLoopback(url) {
  return /^(https?:\/\/)?(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?/i.test(url || "");
}

function jwtRef(jwt) {
  try {
    const parts = jwt.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return typeof payload.ref === "string" ? payload.ref : null;
  } catch {
    return null;
  }
}

function hostRef(url) {
  try {
    const match = new URL(url).hostname.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function logPresence(env, key) {
  console.log(`${key}:`, present(env[key]) ? "PRESENT" : "MISSING");
}

async function checkHealth(baseUrl) {
  try {
    const res = await fetch(`${baseUrl}/api/v1/health`, { signal: AbortSignal.timeout(8000) });
    console.log("LOOPBACK_HEALTH:", res.ok ? "OK" : "FAIL");
    return res.ok;
  } catch {
    console.log("LOOPBACK_HEALTH: FAIL");
    return false;
  }
}

async function checkRateLimitRpc(env) {
  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  // Presence probe only: null args make the function fail validation before writes.
  const { error } = await admin.rpc("rate_limit_try_increment_multi", {
    p_window_start: null,
    p_buckets: null,
  });
  const missing =
    error?.code === "PGRST202" ||
    /could not find|not found|does not exist|schema cache/i.test(error?.message || "");
  console.log("RATE_LIMIT_RPC:", missing ? "MISSING" : "PRESENT");
  return !missing;
}

async function main() {
  const env = mergeEnv();
  const baseUrl = (env.PHASE4_BASE_URL || env.PLAYWRIGHT_BASE_URL || env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
  if (baseUrl) process.env.PHASE4_BASE_URL = baseUrl;

  console.log("PHASE4_PREFLIGHT: START");
  console.log("BASE_URL_KIND:", isLoopback(baseUrl) ? "loopback" : present(baseUrl) ? "non_loopback" : "MISSING");
  for (const key of [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "PHASE4_MANAGER_EMAIL",
    "PHASE4_MANAGER_PASSWORD",
    "PHASE4_WORKER_A_EMAIL",
    "PHASE4_WORKER_A_PASSWORD",
    "PHASE4_WORKER_B_EMAIL",
    "PHASE4_WORKER_B_PASSWORD",
    "PHASE4_PROJECT_ID",
    "PHASE4_WORKER_A_TASK_ID",
    "PHASE4_WORKER_B_TASK_ID",
    "PHASE4_DEVICE_A_ID",
    "PHASE4_DEVICE_B_ID",
  ]) {
    logPresence(env, key);
  }

  console.log("APNS_TOKEN:", present(env.APNS_AUTH_KEY) || present(env.APNS_KEY_ID) ? "PRESENT" : "MISSING");
  console.log("FCM_TOKEN:", present(env.FCM_SERVER_KEY) || present(env.FIREBASE_SERVICE_ACCOUNT_JSON) ? "PRESENT" : "MISSING");
  console.log("QA_TOKEN:", present(env.QA_TOKEN) || present(env.PHASE4_QA_TOKEN) ? "PRESENT" : "MISSING");
  console.log("PHASE4_TEMP_RESIDUE_CHECK:", "orchestrator must prove PHASE4 TEMP residue 0 in cleanup");

  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "PHASE4_MANAGER_EMAIL",
    "PHASE4_MANAGER_PASSWORD",
    "PHASE4_WORKER_A_EMAIL",
    "PHASE4_WORKER_A_PASSWORD",
    "PHASE4_WORKER_B_EMAIL",
    "PHASE4_WORKER_B_PASSWORD",
    "PHASE4_PROJECT_ID",
    "PHASE4_WORKER_A_TASK_ID",
    "PHASE4_WORKER_B_TASK_ID",
    "PHASE4_DEVICE_A_ID",
    "PHASE4_DEVICE_B_ID",
  ];

  if (!baseUrl || !isLoopback(baseUrl)) {
    console.log("PREFLIGHT_BLOCKED: loopback PHASE4_BASE_URL/PLAYWRIGHT_BASE_URL required.");
    process.exit(2);
  }
  if (required.some((key) => !present(env[key]))) {
    console.log("PREFLIGHT_BLOCKED: required env missing.");
    process.exit(2);
  }
  if (!env.SUPABASE_SERVICE_ROLE_KEY.includes(".") || env.SUPABASE_SERVICE_ROLE_KEY.split(".").length !== 3) {
    console.log("PREFLIGHT_BLOCKED: service-role JWT shape invalid.");
    process.exit(2);
  }

  const urlRef = hostRef(env.NEXT_PUBLIC_SUPABASE_URL);
  const anonRef = jwtRef(env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const serviceRef = jwtRef(env.SUPABASE_SERVICE_ROLE_KEY);
  console.log("SUPABASE_REFS_MATCH:", urlRef && urlRef === anonRef && anonRef === serviceRef ? "YES" : "NO");
  console.log("SUPABASE_REF_AISTROYKA:", urlRef === AISTROYKA_REF ? "YES" : "NO");
  if (!urlRef || urlRef !== anonRef || anonRef !== serviceRef || urlRef !== AISTROYKA_REF) {
    console.log("PREFLIGHT_BLOCKED: Supabase ref mismatch or not AISTROYKA.");
    process.exit(2);
  }

  if (!(await checkHealth(baseUrl))) {
    console.log("PREFLIGHT_BLOCKED: loopback health unavailable.");
    process.exit(2);
  }

  // Rate-limit / strict-idempotency RPC may be absent until owner applies migration.
  // Do NOT apply migrations in Phase 4. Authenticated mobile writes use legacy idempotency.
  // Live strict concurrency proof remains BLOCKED_EXTERNAL when RPC is MISSING.
  const rateLimitPresent = await checkRateLimitRpc(env);
  console.log(
    "LIVE_STRICT_IDEMPOTENCY_DB:",
    rateLimitPresent ? "AVAILABLE" : "BLOCKED_EXTERNAL_MISSING_RPC"
  );

  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith("PHASE4_") || key.startsWith("NEXT_PUBLIC_") || key === "SUPABASE_SERVICE_ROLE_KEY") {
      process.env[key] = value;
    }
  }
  console.log("PHASE4_PREFLIGHT: OK");
}

main().catch((error) => {
  console.log("PREFLIGHT_BLOCKED:", error instanceof Error ? error.message : "unknown");
  process.exit(2);
});
