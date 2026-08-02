/**
 * Phase 3D platform-admin credential preflight.
 * Prints PRESENT/MISSING and sanitized runtime results only.
 * Exit 0 = ready for required Playwright (positive + negative personas).
 * Exit 2 = BLOCKED_EXTERNAL.
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../../..");
const webRoot = path.resolve(__dirname, "../..");

const POSITIVE_PAIRS = [
  ["ROMA_PLATFORM_OWNER_EMAIL", "ROMA_PLATFORM_OWNER_PASSWORD"],
  ["QA_PLATFORM_OWNER_EMAIL", "QA_PLATFORM_OWNER_PASSWORD"],
  ["PLATFORM_OWNER_EMAIL", "PLATFORM_OWNER_PASSWORD"],
  ["SMOKE_EMAIL", "SMOKE_PASSWORD"],
];

const NEGATIVE_PAIRS = [
  ["QA_OWNER_EMAIL", "QA_OWNER_PASSWORD"],
  ["QA_MANAGER_EMAIL", "QA_MANAGER_PASSWORD"],
  ["QA_WORKER_EMAIL", "QA_WORKER_PASSWORD"],
  ["QA_ADMIN_EMAIL", "QA_ADMIN_PASSWORD"],
  ["E2E_USER_EMAIL", "E2E_USER_PASSWORD"],
  ["E2E_EMAIL", "E2E_PASSWORD"],
  ["PILOT_E2E_EMAIL", "PILOT_E2E_PASSWORD"],
];

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const out = {};
  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (v) out[k] = v;
  }
  return out;
}

function mergeEnv() {
  const root = loadEnvFile(path.join(repoRoot, ".env.local"));
  const web = loadEnvFile(path.join(webRoot, ".env.local"));
  const pilot = loadEnvFile(path.join(repoRoot, ".env.pilot"));
  const env = { ...process.env, ...web, ...pilot, ...root };
  const rootSk = root.SUPABASE_SERVICE_ROLE_KEY || "";
  if (rootSk.includes(".") && rootSk.split(".").length === 3) {
    env.SUPABASE_SERVICE_ROLE_KEY = rootSk;
  }
  return env;
}

function present(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function firstCompletePair(env, pairs) {
  for (const [ek, pk] of pairs) {
    if (present(env[ek]) && present(env[pk])) {
      return { emailKey: ek, passwordKey: pk, email: env[ek].trim(), password: env[pk] };
    }
  }
  return null;
}

function isLoopback(url) {
  return /localhost|127\.0\.0\.1|\[::1\]/.test(url || "");
}

async function main() {
  const env = mergeEnv();
  const baseUrl = (env.PLAYWRIGHT_BASE_URL || env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");

  console.log("PLAYWRIGHT_BASE_URL:", present(env.PLAYWRIGHT_BASE_URL) ? "PRESENT" : "MISSING");
  console.log("NEXT_PUBLIC_APP_URL:", present(env.NEXT_PUBLIC_APP_URL) ? "PRESENT" : "MISSING");
  console.log("BASE_URL_KIND:", isLoopback(baseUrl) ? "loopback" : present(baseUrl) ? "remote" : "MISSING");
  console.log("SUPABASE_URL:", present(env.NEXT_PUBLIC_SUPABASE_URL) ? "PRESENT" : "MISSING");
  console.log(
    "SERVICE_ROLE:",
    present(env.SUPABASE_SERVICE_ROLE_KEY) && String(env.SUPABASE_SERVICE_ROLE_KEY).includes(".")
      ? "JWT_PRESENT"
      : "MISSING_OR_PLACEHOLDER"
  );
  console.log("CF_ACCESS_CLIENT_ID:", present(env.CF_ACCESS_CLIENT_ID) ? "PRESENT" : "MISSING");
  console.log("CF_ACCESS_CLIENT_SECRET:", present(env.CF_ACCESS_CLIENT_SECRET) ? "PRESENT" : "MISSING");

  for (const [ek, pk] of [...POSITIVE_PAIRS, ...NEGATIVE_PAIRS]) {
    console.log(`${ek}: ${present(env[ek]) ? "PRESENT" : "MISSING"}`);
    console.log(`${pk}: ${present(env[pk]) ? "PRESENT" : "MISSING"}`);
  }

  if (!present(baseUrl) || !isLoopback(baseUrl)) {
    if (present(baseUrl) && !isLoopback(baseUrl)) {
      if (!present(env.CF_ACCESS_CLIENT_ID) || !present(env.CF_ACCESS_CLIENT_SECRET)) {
        console.log("PREFLIGHT_BLOCKED: remote admin host requires Cloudflare Access service-token pair.");
        process.exit(2);
      }
    } else {
      console.log("PREFLIGHT_BLOCKED: loopback PLAYWRIGHT_BASE_URL required for Phase 3D local E2E.");
      process.exit(2);
    }
  }

  const positive = firstCompletePair(env, POSITIVE_PAIRS);
  const negative = firstCompletePair(env, NEGATIVE_PAIRS);
  console.log("POSITIVE_PAIR_SOURCE:", positive ? positive.emailKey : "MISSING");
  console.log("NEGATIVE_PAIR_SOURCE:", negative ? negative.emailKey : "MISSING");

  if (!positive) {
    console.log("PREFLIGHT_BLOCKED: no complete positive platform-owner credential pair.");
    process.exit(2);
  }
  if (!negative) {
    console.log(
      "PREFLIGHT_BLOCKED: no complete distinct negative authenticated pair without platform grant (QA_OWNER_/MANAGER_/WORKER_/E2E_/PILOT_*)."
    );
    process.exit(2);
  }
  if (positive.email.toLowerCase() === negative.email.toLowerCase()) {
    console.log("PREFLIGHT_BLOCKED: positive and negative must be different auth users.");
    process.exit(2);
  }

  if (
    !present(env.NEXT_PUBLIC_SUPABASE_URL) ||
    !present(env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    !present(env.SUPABASE_SERVICE_ROLE_KEY)
  ) {
    console.log("PREFLIGHT_BLOCKED: Supabase URL/anon/service-role incomplete.");
    process.exit(2);
  }

  const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: posAuth, error: posErr } = await anon.auth.signInWithPassword({
    email: positive.email,
    password: positive.password,
  });
  console.log("POSITIVE_LOGIN:", posErr || !posAuth?.user ? "FAIL" : "OK");
  if (posErr || !posAuth?.user) {
    console.log("PREFLIGHT_BLOCKED: positive login failed.");
    process.exit(2);
  }
  const { data: posGrant, error: posGrantErr } = await admin
    .from("platform_owner_grants")
    .select("role")
    .eq("user_id", posAuth.user.id)
    .maybeSingle();
  console.log("POSITIVE_GRANT_QUERY:", posGrantErr ? "ERROR" : "OK");
  console.log("POSITIVE_GRANT:", posGrant ? "PRESENT" : "ABSENT");
  const posRole = posGrant?.role;
  console.log(
    "POSITIVE_ROLE:",
    posRole && ["OWNER", "OWNER_OPERATOR", "OWNER_READONLY"].includes(posRole) ? posRole : "INVALID_OR_MISSING"
  );
  if (!posGrant || !["OWNER", "OWNER_OPERATOR", "OWNER_READONLY"].includes(posRole)) {
    console.log("PREFLIGHT_BLOCKED: positive user lacks valid platform_owner_grants role.");
    process.exit(2);
  }
  await anon.auth.signOut();

  const { data: negAuth, error: negErr } = await anon.auth.signInWithPassword({
    email: negative.email,
    password: negative.password,
  });
  console.log("NEGATIVE_LOGIN:", negErr || !negAuth?.user ? "FAIL" : "OK");
  if (negErr || !negAuth?.user) {
    console.log("PREFLIGHT_BLOCKED: negative login failed.");
    process.exit(2);
  }
  const { data: negGrant, error: negGrantErr } = await admin
    .from("platform_owner_grants")
    .select("role")
    .eq("user_id", negAuth.user.id)
    .maybeSingle();
  console.log("NEGATIVE_GRANT_QUERY:", negGrantErr ? "ERROR" : "OK");
  console.log("NEGATIVE_GRANT:", negGrant ? "PRESENT" : "ABSENT");
  if (negGrant) {
    console.log(
      "PREFLIGHT_BLOCKED: negative persona has platform_owner_grants — cannot use as non-grant denial subject."
    );
    process.exit(2);
  }
  await anon.auth.signOut();

  // Export keys for Playwright child (values already in env from files)
  process.env.PHASE3D_POSITIVE_EMAIL_KEY = positive.emailKey;
  process.env.PHASE3D_NEGATIVE_EMAIL_KEY = negative.emailKey;
  process.env.PHASE3D_POSITIVE_ROLE = posRole;
  console.log("PREFLIGHT_OK: positive grant + distinct negative non-grant personas verified.");
  process.exit(0);
}

main().catch((e) => {
  console.log("PREFLIGHT_BLOCKED: unexpected error:", String(e?.message || e).slice(0, 120));
  process.exit(2);
});
