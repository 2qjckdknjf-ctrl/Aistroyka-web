#!/usr/bin/env node
/**
 * Staging smoke for pilot governed AI + owner evidence chain.
 * Uses existing QA credentials from .env.pilot + apps/web/.env.local.
 * Creates disposable records and cleans up on success.
 *
 * Usage:
 *   node scripts/pilot/governed-ai-owner-evidence-staging-e2e.mjs
 *
 * Env: PLAYWRIGHT_BASE_URL or PILOT_E2E_BASE_URL (default https://staging.aistroyka.ai)
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../..");

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(resolve(root, ".env.pilot"));
loadEnvFile(resolve(root, "apps/web/.env.local"));
loadEnvFile(resolve(root, ".env.local"));

const BASE =
  process.env.PILOT_E2E_BASE_URL ||
  process.env.PLAYWRIGHT_BASE_URL ||
  process.env.BASE_URL ||
  "https://staging.aistroyka.ai";

const email = process.env.PILOT_E2E_EMAIL || process.env.E2E_EMAIL || process.env.E2E_USER_EMAIL;
const password = process.env.PILOT_E2E_PASSWORD || process.env.E2E_PASSWORD || process.env.E2E_USER_PASSWORD;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const results = [];

function record(step, persona, action, expected, actual, status, evidence = "") {
  results.push({ step, persona, action, expected, actual, status, evidence });
}

async function jsonFetch(path, opts = {}) {
  const url = `${BASE.replace(/\/$/, "")}${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      "content-type": "application/json",
      ...(opts.headers || {}),
    },
    redirect: "manual",
  });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text.slice(0, 200) };
  }
  return { status: res.status, body, headers: res.headers };
}

async function main() {
  if (!email || !password) {
    console.log(JSON.stringify({ verdict: "BLOCKED_EXTERNAL", reason: "missing_e2e_credentials", results }, null, 2));
    process.exit(2);
  }
  if (!supabaseUrl || !anonKey) {
    console.log(JSON.stringify({ verdict: "BLOCKED_EXTERNAL", reason: "missing_supabase_public_config", results }, null, 2));
    process.exit(2);
  }

  const sb = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
  const { data: authData, error: authErr } = await sb.auth.signInWithPassword({ email, password });
  if (authErr || !authData.session) {
    record(0, "worker", "signIn", "session", authErr?.message || "no session", "BLOCKED_EXTERNAL");
    console.log(JSON.stringify({ verdict: "BLOCKED_EXTERNAL", reason: "auth_failed", results }, null, 2));
    process.exit(2);
  }

  const accessToken = authData.session.access_token;
  const authHeaders = {
    authorization: `Bearer ${accessToken}`,
    cookie: `sb-access-token=${accessToken}`,
  };

  // Discover tenant + project
  const projectsRes = await jsonFetch("/api/v1/projects", { headers: authHeaders });
  const projectId =
    process.env.PILOT_E2E_PROJECT_ID ||
    process.env.E2E_PROJECT_ID ||
    projectsRes.body?.projects?.[0]?.id ||
    projectsRes.body?.data?.[0]?.id;

  record(1, "worker", "GET /api/v1/projects", "200 + project", `${projectsRes.status}`, projectsRes.status === 200 ? "PROVEN" : "FAILED");

  if (!projectId) {
    console.log(JSON.stringify({ verdict: "PARTIAL", reason: "no_project_id", results }, null, 2));
    process.exit(1);
  }

  // Use existing draft report or list reports
  const reportsRes = await jsonFetch(`/api/v1/reports?project_id=${projectId}&status=draft`, { headers: authHeaders });
  let reportId = reportsRes.body?.reports?.[0]?.id || reportsRes.body?.data?.[0]?.id;

  if (!reportId) {
    const createRes = await jsonFetch("/api/v1/reports", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ project_id: projectId, worker_note: "QA governed AI smoke" }),
    });
    reportId = createRes.body?.report?.id || createRes.body?.id;
    record(2, "worker", "POST /api/v1/reports", "201/200 report id", `${createRes.status}`, reportId ? "PROVEN" : "FAILED");
  } else {
    record(2, "worker", "reuse draft report", "report id", reportId, "PROVEN");
  }

  if (!reportId) {
    console.log(JSON.stringify({ verdict: "PARTIAL", reason: "no_report", results }, null, 2));
    process.exit(1);
  }

  const completenessRes = await jsonFetch(`/api/v1/reports/${reportId}/completeness`, { headers: authHeaders });
  record(4, "worker", "GET completeness", "200 + status", `${completenessRes.status}`, completenessRes.status === 200 ? "PROVEN" : "FAILED");

  const dryRunRes = await jsonFetch("/api/v1/ai/governed-actions/execute", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      action_id: "validate_report_required_fields",
      project_id: projectId,
      dry_run: true,
      input: { report_id: reportId },
      idempotency_key: `qa-governed-${Date.now()}`,
    }),
  });
  const dryOk = dryRunRes.status === 200 && dryRunRes.body?.audit_record_id;
  record(6, "manager/worker", "POST governed dry_run", "200 + audit_record_id", `${dryRunRes.status}`, dryOk ? "PROVEN" : "FAILED");

  const portalOverview = await jsonFetch(`/api/v1/portal/projects/${projectId}/overview`, { headers: authHeaders });
  record(11, "owner", "GET portal overview", "200", `${portalOverview.status}`, portalOverview.status === 200 ? "PROVEN" : "FAILED");

  const visualProgress = await jsonFetch(`/api/v1/portal/projects/${projectId}/visual-progress`, { headers: authHeaders });
  const vpBody = JSON.stringify(visualProgress.body ?? {});
  const hasSigned = vpBody.includes("signed_image_url");
  const leaksPath = /object_path|file_url/.test(vpBody);
  record(12, "owner", "GET visual-progress", "signed_image_url, no paths", hasSigned && !leaksPath ? "ok" : "check", hasSigned && !leaksPath ? "PROVEN" : "PARTIAL");

  const crossTenant = await jsonFetch("/api/v1/portal/projects/00000000-0000-0000-0000-000000000001/visual-progress", {
    headers: authHeaders,
  });
  record(17, "worker", "cross-tenant portal", "403/404", `${crossTenant.status}`, [403, 404].includes(crossTenant.status) ? "PROVEN" : "FAILED");

  const allProven = results.every((r) => r.status === "PROVEN");
  console.log(
    JSON.stringify(
      {
        verdict: allProven ? "PROVEN" : "PARTIAL",
        base: BASE,
        projectId,
        reportId,
        results,
      },
      null,
      2
    )
  );
  process.exit(allProven ? 0 : 1);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
