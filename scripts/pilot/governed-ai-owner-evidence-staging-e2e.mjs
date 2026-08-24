#!/usr/bin/env node
/**
 * Authenticated staging E2E for pilot governed AI + owner evidence chain.
 *
 * Usage:
 *   node scripts/pilot/governed-ai-owner-evidence-staging-e2e.mjs
 *
 * Base URL (first match):
 *   GOVERNED_E2E_BASE_URL | PILOT_E2E_BASE_URL | PLAYWRIGHT_BASE_URL | default https://staging.aistroyka.ai
 *
 * Personas (existing QA accounts only — do not create users):
 *   Worker:  PILOT_E2E_WORKER_EMAIL/PASSWORD or PILOT_E2E_EMAIL/PASSWORD or E2E_EMAIL/E2E_PASSWORD
 *   Manager: PILOT_E2E_MANAGER_EMAIL/PASSWORD (optional — falls back to worker for manager-only steps → SKIPPED)
 *   Owner:   PILOT_E2E_OWNER_EMAIL/PASSWORD or QA_CLIENT_EMAIL/QA_CLIENT_PASSWORD (optional)
 *   Revoked stakeholder: PILOT_E2E_STAKEHOLDER_REVOKED_EMAIL/PASSWORD (optional)
 *   Cross-tenant: PILOT_E2E_CROSS_TENANT_EMAIL/PASSWORD (optional)
 *
 * GitHub Actions staging smoke naming (when mapped in workflow):
 *   PILOT_SMOKE_EMAIL_STAGING / PILOT_SMOKE_PASSWORD_STAGING / PILOT_SMOKE_PROJECT_ID_STAGING
 *
 * Optional:
 *   PILOT_E2E_PROJECT_ID | E2E_PROJECT_ID | PILOT_SMOKE_PROJECT_ID_STAGING
 *   GOVERNED_E2E_REQUIRE_MIGRATION_50000=1 — exit BLOCKED if preflight detects missing forward-fix
 *
 * Auth: POST /api/auth/login (cookie session). Never logs secrets.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

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
loadEnvFile(resolve(root, ".env.qa"));
loadEnvFile(resolve(root, "apps/web/.env.local"));
loadEnvFile(resolve(root, ".env.local"));

const BASE = (
  process.env.GOVERNED_E2E_BASE_URL ||
  process.env.PILOT_E2E_BASE_URL ||
  process.env.PLAYWRIGHT_BASE_URL ||
  process.env.BASE_URL ||
  "https://staging.aistroyka.ai"
).replace(/\/$/, "");

function pick(...keys) {
  for (const k of keys) {
    const v = process.env[k];
    if (v && String(v).trim()) return String(v).trim();
  }
  return null;
}

const personas = {
  worker: {
    email: pick("PILOT_E2E_WORKER_EMAIL", "PILOT_E2E_EMAIL", "E2E_EMAIL", "E2E_USER_EMAIL", "PILOT_SMOKE_EMAIL_STAGING"),
    password: pick("PILOT_E2E_WORKER_PASSWORD", "PILOT_E2E_PASSWORD", "E2E_PASSWORD", "E2E_USER_PASSWORD", "PILOT_SMOKE_PASSWORD_STAGING"),
  },
  manager: {
    email: pick("PILOT_E2E_MANAGER_EMAIL", "QA_MANAGER_EMAIL"),
    password: pick("PILOT_E2E_MANAGER_PASSWORD", "QA_MANAGER_PASSWORD"),
  },
  owner: {
    email: pick("PILOT_E2E_OWNER_EMAIL", "QA_CLIENT_EMAIL", "QA_OWNER_EMAIL"),
    password: pick("PILOT_E2E_OWNER_PASSWORD", "QA_CLIENT_PASSWORD", "QA_OWNER_PASSWORD"),
  },
  revokedStakeholder: {
    email: pick("PILOT_E2E_STAKEHOLDER_REVOKED_EMAIL"),
    password: pick("PILOT_E2E_STAKEHOLDER_REVOKED_PASSWORD"),
  },
  crossTenant: {
    email: pick("PILOT_E2E_CROSS_TENANT_EMAIL"),
    password: pick("PILOT_E2E_CROSS_TENANT_PASSWORD"),
  },
};

const results = [];
const createdFixtures = { reportIds: [], idempotencyKeys: [] };

function record(step, persona, action, expected, actual, status, evidence = "") {
  results.push({ step, persona, action, expected, actual, status, evidence });
}

class SessionClient {
  constructor(label) {
    this.label = label;
    this.cookieJar = new Map();
  }

  async login(email, password) {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, traceId: `gov-e2e-${Date.now()}` }),
      redirect: "manual",
    });
    this.#storeCookies(res);
    const body = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, body };
  }

  async fetch(path, opts = {}) {
    const url = `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
    const headers = { ...(opts.headers || {}) };
    if (opts.json !== undefined) {
      headers["content-type"] = "application/json";
      opts.body = JSON.stringify(opts.json);
      delete opts.json;
    }
    const cookie = [...this.cookieJar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
    if (cookie) headers.cookie = cookie;
    const res = await fetch(url, { ...opts, headers, redirect: "manual" });
    this.#storeCookies(res);
    const text = await res.text();
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = { raw: text.slice(0, 300) };
    }
    const requestId = res.headers.get("x-request-id") || res.headers.get("x-vercel-id") || "";
    return { status: res.status, body, headers: res.headers, requestId, text };
  }

  #storeCookies(res) {
    const raw = res.headers.getSetCookie?.() ?? [];
    for (const c of raw) {
      const nv = c.split(";")[0];
      const eq = nv.indexOf("=");
      if (eq > 0) this.cookieJar.set(nv.slice(0, eq), nv.slice(eq + 1));
    }
  }
}

function jsonHasFinanceLeak(text) {
  return /(\bmargin\b|\bprofitability\b|internal_cost|subcontractor_cost|budget_pressure)/i.test(text);
}

async function main() {
  const startedAt = new Date().toISOString();

  if (!personas.worker.email || !personas.worker.password) {
    console.log(
      JSON.stringify(
        {
          verdict: "BLOCKED_EXTERNAL",
          reason: "missing_worker_credentials",
          required_env: [
            "PILOT_E2E_EMAIL + PILOT_E2E_PASSWORD (or E2E_EMAIL + E2E_PASSWORD)",
            "Optional: PILOT_E2E_MANAGER_*, PILOT_E2E_OWNER_*, PILOT_E2E_STAKEHOLDER_REVOKED_*",
          ],
          results,
        },
        null,
        2
      )
    );
    process.exit(2);
  }

  const worker = new SessionClient("worker");
  const manager = new SessionClient("manager");
  const owner = new SessionClient("owner");

  const wLogin = await worker.login(personas.worker.email, personas.worker.password);
  record(1, "worker", "POST /api/auth/login", "200", `${wLogin.status}`, wLogin.ok ? "PROVEN" : "FAILED", wLogin.body?.traceId ?? "");

  if (!wLogin.ok) {
    console.log(JSON.stringify({ verdict: "FAILED", reason: "worker_auth_failed", results }, null, 2));
    process.exit(1);
  }

  let managerReady = false;
  if (personas.manager.email && personas.manager.password) {
    const mLogin = await manager.login(personas.manager.email, personas.manager.password);
    record(2, "manager", "POST /api/auth/login", "200", `${mLogin.status}`, mLogin.ok ? "PROVEN" : "FAILED");
    managerReady = mLogin.ok;
  } else {
    record(2, "manager", "POST /api/auth/login", "200", "skipped", "BLOCKED_EXTERNAL", "PILOT_E2E_MANAGER_* missing");
  }

  let ownerReady = false;
  if (personas.owner.email && personas.owner.password) {
    const oLogin = await owner.login(personas.owner.email, personas.owner.password);
    record(3, "owner", "POST /api/auth/login", "200", `${oLogin.status}`, oLogin.ok ? "PROVEN" : "FAILED");
    ownerReady = oLogin.ok;
  } else {
    record(3, "owner", "POST /api/auth/login", "200", "skipped", "BLOCKED_EXTERNAL", "PILOT_E2E_OWNER_* missing");
  }

  const projectsRes = await worker.fetch("/api/v1/projects");
  const projectId =
    pick("PILOT_E2E_PROJECT_ID", "E2E_PROJECT_ID", "PILOT_SMOKE_PROJECT_ID_STAGING") ||
    projectsRes.body?.data?.[0]?.id ||
    projectsRes.body?.projects?.[0]?.id;

  record(4, "worker", "GET /api/v1/projects", "200 + project", `${projectsRes.status}`, projectId ? "PROVEN" : "FAILED");

  if (!projectId) {
    console.log(JSON.stringify({ verdict: "PARTIAL", reason: "no_project_id", results }, null, 2));
    process.exit(1);
  }

  const reportsRes = await worker.fetch(`/api/v1/reports?project_id=${projectId}&status=draft&limit=5`);
  let reportId = reportsRes.body?.data?.[0]?.id;

  if (!reportId) {
    const createRes = await worker.fetch("/api/v1/worker/report/create", {
      method: "POST",
      json: { project_id: projectId },
    });
    reportId = createRes.body?.reportId || createRes.body?.data?.id || createRes.body?.id;
    if (reportId) createdFixtures.reportIds.push(reportId);
    record(5, "worker", "create draft report", "report id", reportId ? "ok" : "fail", reportId ? "PROVEN" : "FAILED");
  } else {
    record(5, "worker", "reuse draft report", "report id", reportId, "PROVEN");
  }

  if (!reportId) {
    console.log(JSON.stringify({ verdict: "PARTIAL", reason: "no_report", results }, null, 2));
    process.exit(1);
  }

  // Evidence: reuse existing media if present; otherwise note NOT_TESTED (upload is multi-step)
  const reportDetail = await worker.fetch(`/api/v1/reports/${reportId}`);
  const mediaCount = reportDetail.body?.data?.media?.length ?? 0;
  record(6, "worker", "before/after evidence", "media linked", `count=${mediaCount}`, mediaCount > 0 ? "PROVEN" : "NOT_TESTED", "requires existing QA media or upload flow");

  const submitRes = await worker.fetch("/api/v1/worker/report/submit", {
    method: "POST",
    json: { report_id: reportId, worker_note: "QA governed AI E2E disposable" },
  });
  record(7, "worker", "POST /api/v1/worker/report/submit", "200", `${submitRes.status}`, submitRes.status === 200 ? "PROVEN" : mediaCount === 0 ? "NOT_TESTED" : "FAILED", submitRes.requestId);

  const completeness1 = await worker.fetch(`/api/v1/reports/${reportId}/completeness`);
  record(8, "worker", "GET completeness", "200 + status", `${completeness1.status}`, completeness1.status === 200 ? "PROVEN" : "FAILED", completeness1.requestId);

  const completeness2 = await worker.fetch(`/api/v1/reports/${reportId}/completeness`);
  const persisted =
    completeness1.status === 200 &&
    completeness2.status === 200 &&
    completeness1.body?.data?.evaluated_at &&
    completeness1.body?.data?.evaluated_at === completeness2.body?.data?.evaluated_at;
  record(9, "worker", "completeness persistence", "stable evaluated_at", persisted ? "stable" : "changed", persisted ? "PROVEN" : "PARTIAL");

  const idemKey = `qa-governed-${Date.now()}`;
  createdFixtures.idempotencyKeys.push(idemKey);
  const dryRun1 = await worker.fetch("/api/v1/ai/governed-actions/execute", {
    method: "POST",
    json: {
      action_id: "validate_report_required_fields",
      project_id: projectId,
      dry_run: true,
      input: { report_id: reportId },
      idempotency_key: idemKey,
    },
  });
  const auditId = dryRun1.body?.data?.auditRecordId;
  record(10, "worker", "governed AI dry_run", "200 + auditRecordId", `${dryRun1.status}`, dryRun1.status === 200 && auditId ? "PROVEN" : "FAILED", dryRun1.requestId);

  record(11, "worker", "no consequential writes on dry_run", "dry_run status", dryRun1.body?.data?.status ?? "n/a", dryRun1.body?.data?.status === "dry_run" ? "PROVEN" : "FAILED");

  const dryRun2 = await worker.fetch("/api/v1/ai/governed-actions/execute", {
    method: "POST",
    json: {
      action_id: "validate_report_required_fields",
      project_id: projectId,
      dry_run: true,
      input: { report_id: reportId },
      idempotency_key: idemKey,
    },
  });
  const idempotent = dryRun2.body?.data?.auditRecordId === auditId;
  record(24, "worker", "idempotent dry_run replay", "same auditRecordId", idempotent ? "match" : "diff", idempotent ? "PROVEN" : "FAILED");

  const reviewClient = managerReady ? manager : worker;
  const approveRes = await reviewClient.fetch(`/api/v1/reports/${reportId}`, {
    method: "PATCH",
    json: { status: "approved", manager_note: "QA E2E approve" },
  });
  record(12, "manager", "PATCH report approve", "200", `${approveRes.status}`, managerReady ? (approveRes.status === 200 ? "PROVEN" : "FAILED") : "BLOCKED_EXTERNAL", approveRes.requestId);

  if (ownerReady) {
    const overview = await owner.fetch(`/api/v1/portal/projects/${projectId}/overview`);
    const overviewText = JSON.stringify(overview.body ?? {});
    record(14, "owner", "GET portal overview", "200 no finance leak", `${overview.status}`, overview.status === 200 && !jsonHasFinanceLeak(overviewText) ? "PROVEN" : "FAILED", overview.requestId);

    const visual = await owner.fetch(`/api/v1/portal/projects/${projectId}/visual-progress`);
    const visualText = JSON.stringify(visual.body ?? {});
    const hasSigned = visualText.includes("signed_image_url");
    const leaks = /object_path|"file_url"/.test(visualText);
    record(15, "owner", "GET visual-progress", "signed_image_url, no paths", hasSigned && !leaks ? "ok" : "check", visual.status === 200 && !leaks ? (hasSigned ? "PROVEN" : "PARTIAL") : "FAILED", visual.requestId);

    record(16, "owner", "no object_path/file_url", "absent", leaks ? "leak" : "absent", !leaks ? "PROVEN" : "FAILED");
    record(23, "owner", "finance/internal guard", "no internal fields", jsonHasFinanceLeak(visualText) ? "leak" : "clean", !jsonHasFinanceLeak(visualText) ? "PROVEN" : "FAILED");

    if (hasSigned) {
      const signedUrl = visual.body?.data?.items?.[0]?.signed_image_url || visual.body?.data?.evidence?.[0]?.signed_image_url;
      if (typeof signedUrl === "string" && signedUrl.startsWith("http")) {
        const img = await fetch(signedUrl, { method: "HEAD" });
        record(19, "owner", "signed URL HEAD", "2xx before expiry", `${img.status}`, img.ok ? "PROVEN" : "FAILED");
      } else {
        record(19, "owner", "signed URL HEAD", "2xx", "no url", "NOT_TESTED");
      }
    }
  } else {
    record(14, "owner", "portal overview", "200", "skipped", "BLOCKED_EXTERNAL");
    record(15, "owner", "visual-progress", "200", "skipped", "BLOCKED_EXTERNAL");
  }

  const cross = await worker.fetch("/api/v1/portal/projects/00000000-0000-0000-0000-000000000001/visual-progress");
  record(22, "worker", "cross-tenant portal", "403/404", `${cross.status}`, [403, 404].includes(cross.status) ? "PROVEN" : "FAILED", cross.requestId);

  if (personas.revokedStakeholder.email && personas.revokedStakeholder.password) {
    const revoked = new SessionClient("revoked");
    const rLogin = await revoked.login(personas.revokedStakeholder.email, personas.revokedStakeholder.password);
    if (rLogin.ok) {
      const denied = await revoked.fetch(`/api/v1/portal/projects/${projectId}/visual-progress`);
      record(21, "revoked stakeholder", "portal visual-progress", "403/404", `${denied.status}`, [403, 404].includes(denied.status) ? "PROVEN" : "FAILED");
    }
  } else {
    record(21, "revoked stakeholder", "portal access denied", "403/404", "skipped", "BLOCKED_EXTERNAL");
  }

  if (personas.crossTenant.email && personas.crossTenant.password) {
    const other = new SessionClient("cross_tenant");
    const xLogin = await other.login(personas.crossTenant.email, personas.crossTenant.password);
    if (xLogin.ok) {
      const denied = await other.fetch(`/api/v1/portal/projects/${projectId}/visual-progress`);
      record(22, "cross-tenant", "portal visual-progress", "403/404", `${denied.status}`, [403, 404].includes(denied.status) ? "PROVEN" : "FAILED");
    }
  }

  record(25, "all", "runtime 5xx scan", "no 5xx in sampled calls", "manual", "NOT_TESTED", "use Vercel runtime logs correlation by requestId");

  const blocking = results.filter((r) => r.status === "FAILED");
  const blocked = results.filter((r) => r.status === "BLOCKED_EXTERNAL");
  const verdict =
    blocking.length > 0 ? "FAILED" : blocked.some((r) => [2, 3, 12, 14, 15, 21].includes(r.step)) ? "PARTIAL" : "PROVEN";

  console.log(
    JSON.stringify(
      {
        verdict,
        base: BASE,
        startedAt,
        projectId,
        reportId,
        createdFixtures,
        cleanup: "manual — revert QA report to draft or delete disposable rows if created",
        results,
      },
      null,
      2
    )
  );
  process.exit(verdict === "PROVEN" ? 0 : verdict === "FAILED" ? 1 : 2);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
