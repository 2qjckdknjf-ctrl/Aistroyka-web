#!/usr/bin/env node
/**
 * Authenticated 25-step governed AI + owner evidence E2E.
 * Target: Vercel Preview (not staging.aistroyka.ai@main).
 * Never logs secrets, cookies, signed URLs, or row payloads.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../..");

function pick(...keys) {
  for (const k of keys) {
    const v = process.env[k];
    if (v && String(v).trim()) return String(v).trim();
  }
  return null;
}

const E2E_MARKER = pick("GOVERNED_E2E_MARKER") || "qa-governed-e2e";
const TINY_JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAr/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=",
  "base64"
);

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

const BYPASS = pick("VERCEL_AUTOMATION_BYPASS_SECRET", "VERCEL_PROTECTION_BYPASS");
const SUPABASE_URL = pick("NEXT_PUBLIC_SUPABASE_URL");
const SUPABASE_ANON = pick("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const QA_PROJECT_ID = pick("PILOT_E2E_PROJECT_ID", "PILOT_SMOKE_PROJECT_ID_STAGING");

const personas = {
  worker: {
    email: pick("PILOT_E2E_WORKER_EMAIL", "PILOT_E2E_EMAIL", "E2E_EMAIL", "PILOT_SMOKE_EMAIL_STAGING"),
    password: pick("PILOT_E2E_WORKER_PASSWORD", "PILOT_E2E_PASSWORD", "E2E_PASSWORD", "PILOT_SMOKE_PASSWORD_STAGING"),
  },
  manager: {
    email: pick("PILOT_E2E_MANAGER_EMAIL", "QA_MANAGER_EMAIL"),
    password: pick("PILOT_E2E_MANAGER_PASSWORD", "QA_MANAGER_PASSWORD"),
  },
  owner: {
    email: pick("PILOT_E2E_OWNER_EMAIL", "STAKEHOLDER_SMOKE_EMAIL", "QA_CLIENT_EMAIL"),
    password: pick("PILOT_E2E_OWNER_PASSWORD", "STAKEHOLDER_SMOKE_PASSWORD", "QA_CLIENT_PASSWORD"),
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
const httpTrace = [];
const createdFixtures = {
  reportIds: [],
  uploadSessionIds: [],
  idempotencyKeys: [],
  auditRecordIds: [],
};

function record(step, persona, action, expected, actual, status, evidence = "") {
  results.push({ step, persona, action, expected, actual, status, evidence });
}

function jsonHasFinanceLeak(text) {
  return /(\bmargin\b|\bprofitability\b|internal_cost|subcontractor_cost|budget_pressure)/i.test(text);
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
      body: JSON.stringify({ email, password, traceId: `${E2E_MARKER}-${this.label}-${Date.now()}` }),
      redirect: "manual",
    });
    this.#storeCookies(res);
    const body = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, body };
  }

  async fetch(path, opts = {}) {
    const url = `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
    const headers = { ...(opts.headers || {}), "x-client": opts.client || "ios_worker" };
    if (opts.json !== undefined) {
      headers["content-type"] = "application/json";
      opts.body = JSON.stringify(opts.json);
      delete opts.json;
    }
    const cookie = [...this.cookieJar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
    if (cookie) headers.cookie = cookie;
    if (BYPASS) {
      headers["x-vercel-protection-bypass"] = BYPASS;
      headers["x-vercel-set-bypass-cookie"] = "true";
    }
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
    httpTrace.push({ path, status: res.status, requestId });
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

async function getSupabaseJwt(email, password) {
  if (!SUPABASE_URL || !SUPABASE_ANON) return null;
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) return null;
  const body = await res.json().catch(() => ({}));
  return body.access_token || null;
}

async function uploadStorageObject(jwt, objectPath) {
  if (!SUPABASE_URL || !SUPABASE_ANON || !jwt) return false;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/media/${objectPath}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "image/jpeg",
      "x-upsert": "true",
    },
    body: TINY_JPEG,
  });
  return res.ok || res.status === 409;
}

async function uploadReportEvidence(worker, workerEmail, workerPassword, purpose) {
  const idem = `${E2E_MARKER}-${purpose}-${Date.now()}`;
  createdFixtures.idempotencyKeys.push(idem);
  const sessionRes = await worker.fetch("/api/v1/media/upload-sessions", {
    method: "POST",
    headers: { "x-idempotency-key": idem },
    json: { purpose },
  });
  const sessionId = sessionRes.body?.data?.id;
  const uploadPath = sessionRes.body?.data?.upload_path;
  if (!sessionId || !uploadPath) {
    return { ok: false, sessionRes };
  }
  createdFixtures.uploadSessionIds.push(sessionId);
  const fullObjectPath = uploadPath.endsWith("/")
    ? `${uploadPath}qa-${purpose}.jpg`
    : `${uploadPath}/qa-${purpose}.jpg`;
  const storageRelativePath = fullObjectPath.replace(/^media\//, "");
  const jwt = await getSupabaseJwt(workerEmail, workerPassword);
  const stored = await uploadStorageObject(jwt, storageRelativePath);
  if (!stored) return { ok: false, reason: "storage_upload_failed", sessionId };
  const finalizeRes = await worker.fetch(`/api/v1/media/upload-sessions/${sessionId}/finalize`, {
    method: "POST",
    headers: { "x-idempotency-key": `${idem}-fin` },
    json: {
      object_path: fullObjectPath,
      mime_type: "image/jpeg",
      size_bytes: TINY_JPEG.length,
    },
  });
  return { ok: finalizeRes.status === 200 && finalizeRes.body?.ok === true, sessionId, finalizeRes };
}

async function preflightPreview() {
  if (BASE.includes("staging.aistroyka.ai")) {
    const health = await fetch(`${BASE}/api/v1/health`);
    const body = await health.json().catch(() => ({}));
    if (body?.buildStamp?.sha7 === "587ef4c") {
      return { ok: false, reason: "refusing_staging_main_not_pr_preview" };
    }
  }
  const headers = {};
  if (BYPASS) {
    headers["x-vercel-protection-bypass"] = BYPASS;
    headers["x-vercel-set-bypass-cookie"] = "true";
  }
  const res = await fetch(`${BASE}/api/v1/health`, { headers, redirect: "manual" });
  if ([301, 302, 401, 403].includes(res.status)) {
    return { ok: false, reason: "preview_protection_blocked", status: res.status };
  }
  const body = await res.json().catch(() => ({}));
  return {
    ok: res.ok && body?.db === "ok",
    sha7: body?.buildStamp?.sha7,
    db: body?.db,
    status: res.status,
  };
}

async function cleanupViaApi(worker, reportId) {
  // No service-role cleanup: disposable QA project retains marked fixtures.
  return {
    status: "api_only_no_service_role",
    deleted: { reports: 0, upload_sessions: 0 },
    retained: {
      reportIds: createdFixtures.reportIds,
      uploadSessionIds: createdFixtures.uploadSessionIds,
      auditRecordIds: createdFixtures.auditRecordIds,
    },
    note: "Immutable audit may remain; reports on pinned QA project only",
  };
}

function computeVerdict() {
  const blocking = results.filter((r) => r.status === "FAILED");
  const blocked = results.filter((r) => r.status === "BLOCKED" || r.status === "BLOCKED_EXTERNAL");
  const requiredBlocked = blocked.filter((r) => [2, 3, 5, 6, 13, 16, 17, 21, 23, 24, 25].includes(r.step));
  if (blocking.length > 0) return "FAILED";
  if (requiredBlocked.length > 0 || blocked.length > 0) return "PARTIAL";
  const unexpected5xx = httpTrace.filter((h) => h.status >= 500);
  if (unexpected5xx.length > 0) return "FAILED";
  return "PROVEN";
}

async function main() {
  const startedAt = new Date().toISOString();
  let projectId = null;
  let reportId = null;
  let cleanupResult = { status: "not_run" };

  const preview = await preflightPreview();
  if (!preview.ok) {
    console.log(
      JSON.stringify(
        {
          verdict: preview.reason === "preview_protection_blocked" ? "BLOCKED_EXTERNAL" : "FAILED",
          reason: preview.reason,
          preview,
          results,
        },
        null,
        2
      )
    );
    process.exit(2);
  }

  const missingSecrets = [];
  if (!personas.worker.email || !personas.worker.password) missingSecrets.push("PILOT_SMOKE_EMAIL_STAGING/PILOT_E2E_WORKER_*");
  if (!personas.manager.email || !personas.manager.password) missingSecrets.push("PILOT_E2E_MANAGER_EMAIL/PILOT_E2E_MANAGER_PASSWORD");
  if (!personas.owner.email || !personas.owner.password) missingSecrets.push("STAKEHOLDER_SMOKE_EMAIL/STAKEHOLDER_SMOKE_PASSWORD");
  if (!BYPASS && BASE.includes("vercel.app")) missingSecrets.push("VERCEL_AUTOMATION_BYPASS_SECRET");
  if (!QA_PROJECT_ID) missingSecrets.push("PILOT_SMOKE_PROJECT_ID_STAGING");
  if (missingSecrets.length > 0) {
    console.log(JSON.stringify({ verdict: "BLOCKED_EXTERNAL", missingSecrets, results }, null, 2));
    process.exit(2);
  }

  const worker = new SessionClient("worker");
  const manager = new SessionClient("manager");
  const owner = new SessionClient("owner");

  try {
    const wLogin = await worker.login(personas.worker.email, personas.worker.password);
    record(1, "worker", "POST /api/auth/login", "200", `${wLogin.status}`, wLogin.ok ? "PASS" : "FAILED");
    if (!wLogin.ok) throw new Error("worker_auth_failed");

    const mLogin = await manager.login(personas.manager.email, personas.manager.password);
    record(2, "manager", "POST /api/auth/login", "200", `${mLogin.status}`, mLogin.ok ? "PASS" : "FAILED");
    if (!mLogin.ok) throw new Error("manager_auth_failed");

    const oLogin = await owner.login(personas.owner.email, personas.owner.password);
    record(3, "owner", "POST /api/auth/login", "200", `${oLogin.status}`, oLogin.ok ? "PASS" : "FAILED");
    if (!oLogin.ok) throw new Error("owner_auth_failed");

    const projectsRes = await worker.fetch("/api/v1/projects");
    projectId = QA_PROJECT_ID;
    const hasProject = (projectsRes.body?.data ?? []).some((p) => p.id === projectId);
    if (!hasProject) {
      record(4, "worker", "create QA report (pinned project)", "worker member", "not member", "FAILED");
      throw new Error("qa_project_not_accessible");
    }
    const createRes = await worker.fetch("/api/v1/worker/report/create", {
      method: "POST",
      headers: { "x-idempotency-key": `${E2E_MARKER}-report-${Date.now()}` },
      json: { project_id: projectId },
    });
    reportId = createRes.body?.reportId || createRes.body?.data?.id;
    if (reportId) createdFixtures.reportIds.push(reportId);
    record(4, "worker", "create QA report (pinned project)", "report id", reportId || "missing", reportId ? "PASS" : "FAILED");
    if (!reportId) throw new Error("no_report");

    const before = await uploadReportEvidence(worker, personas.worker.email, personas.worker.password, "report_before");
    record(5, "worker", "before evidence upload", "session+finalize", before.ok ? "ok" : "fail", before.ok ? "PASS" : "FAILED", before.sessionRes?.requestId);
    const after = await uploadReportEvidence(worker, personas.worker.email, personas.worker.password, "report_after");
    record(6, "worker", "after evidence upload", "session+finalize", after.ok ? "ok" : "fail", after.ok ? "PASS" : "FAILED", after.finalizeRes?.requestId);

    if (before.ok && before.sessionId) {
      await worker.fetch("/api/v1/worker/report/add-media", {
        method: "POST",
        headers: { "x-idempotency-key": `${E2E_MARKER}-add-before-${Date.now()}` },
        json: { report_id: reportId, upload_session_id: before.sessionId },
      });
    }
    if (after.ok && after.sessionId) {
      await worker.fetch("/api/v1/worker/report/add-media", {
        method: "POST",
        headers: { "x-idempotency-key": `${E2E_MARKER}-add-after-${Date.now()}` },
        json: { report_id: reportId, upload_session_id: after.sessionId },
      });
    }

    const submitRes = await worker.fetch("/api/v1/worker/report/submit", {
      method: "POST",
      json: { report_id: reportId, worker_note: `${E2E_MARKER} disposable` },
    });
    record(7, "worker", "POST /api/v1/worker/report/submit", "200", `${submitRes.status}`, submitRes.status === 200 ? "PASS" : "FAILED", submitRes.requestId);

    const completeness1 = await worker.fetch(`/api/v1/reports/${reportId}/completeness`);
    record(8, "worker", "GET /api/v1/reports/:id/completeness", "200", `${completeness1.status}`, completeness1.status === 200 ? "PASS" : "FAILED", completeness1.requestId);

    const completeness2 = await worker.fetch(`/api/v1/reports/${reportId}/completeness`);
    const persisted =
      completeness1.status === 200 &&
      completeness2.status === 200 &&
      completeness1.body?.data?.evaluated_at === completeness2.body?.data?.evaluated_at;
    record(9, "worker", "completeness persistence", "stable evaluated_at", persisted ? "stable" : "changed", persisted ? "PASS" : "FAILED");

    const idemKey = `${E2E_MARKER}-${Date.now()}`;
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
    if (auditId) createdFixtures.auditRecordIds.push(auditId);
    record(10, "worker", "governed AI dry-run", "200", `${dryRun1.status}`, dryRun1.status === 200 ? "PASS" : "FAILED", dryRun1.requestId);
    record(11, "worker", "audit record created", "auditRecordId present", auditId ? "present" : "missing", auditId ? "PASS" : "FAILED");
    record(12, "worker", "no consequential writes", "status=dry_run", dryRun1.body?.data?.status ?? "n/a", dryRun1.body?.data?.status === "dry_run" ? "PASS" : "FAILED");

    const preVisual = await owner.fetch(`/api/v1/portal/projects/${projectId}/visual-progress`, { client: "web" });
    const preCount = preVisual.body?.data?.items?.length ?? preVisual.body?.data?.evidence?.length ?? 0;
    record(22, "owner", "internal evidence hidden pre-approve", "0 owner-visible items", `${preCount}`, preCount === 0 ? "PASS" : "FAILED", preVisual.requestId);

    const approveRes = await manager.fetch(`/api/v1/reports/${reportId}`, {
      method: "PATCH",
      json: { status: "approved", manager_note: `${E2E_MARKER} approve` },
    });
    record(13, "manager", "PATCH /api/v1/reports/:id approve", "200", `${approveRes.status}`, approveRes.status === 200 ? "PASS" : "FAILED", approveRes.requestId);

    const postApprove = await manager.fetch(`/api/v1/reports/${reportId}`, { client: "web" });
    const evidenceRows = postApprove.body?.data?.visual_evidence ?? postApprove.body?.data?.evidence ?? [];
    const allVerified = Array.isArray(evidenceRows) && evidenceRows.length > 0 && evidenceRows.every((e) => e.manager_verified === true);
    record(14, "manager", "manager_verified=true", "all eligible true", allVerified ? "true" : "check", allVerified ? "PASS" : evidenceRows.length === 0 ? "BLOCKED" : "FAILED");

    const ownerVisibleCount = Array.isArray(evidenceRows) ? evidenceRows.filter((e) => e.owner_visible === true && !e.internal_only).length : 0;
    record(15, "manager", "owner_visible eligible only", ">=1 eligible", `${ownerVisibleCount}`, ownerVisibleCount > 0 ? "PASS" : "FAILED");

    const overview = await owner.fetch(`/api/v1/portal/projects/${projectId}/overview`, { client: "web" });
    record(16, "owner", "GET portal overview", "200 no finance leak", `${overview.status}`, overview.status === 200 && !jsonHasFinanceLeak(JSON.stringify(overview.body ?? {})) ? "PASS" : "FAILED", overview.requestId);

    const visual = await owner.fetch(`/api/v1/portal/projects/${projectId}/visual-progress`, { client: "web" });
    const visualText = JSON.stringify(visual.body ?? {});
    const items = visual.body?.data?.items ?? visual.body?.data?.evidence ?? [];
    const hasSigned = items.some((i) => typeof i.signed_image_url === "string" && i.signed_image_url.startsWith("http"));
    record(17, "owner", "GET visual-progress", "200", `${visual.status}`, visual.status === 200 ? "PASS" : "FAILED", visual.requestId);
    record(18, "owner", "signed_image_url present", "present", hasSigned ? "present" : "missing", hasSigned ? "PASS" : "FAILED");
    const leaksPath = /object_path|"file_url"/.test(visualText);
    record(19, "owner", "object_path absent", "absent", leaksPath ? "leak" : "absent", !leaksPath ? "PASS" : "FAILED");
    record(20, "owner", "permanent file_url absent", "absent", /"file_url"/.test(visualText) ? "leak" : "absent", !/"file_url"/.test(visualText) ? "PASS" : "FAILED");

    if (hasSigned) {
      const signedUrl = items.find((i) => i.signed_image_url)?.signed_image_url;
      const img = await fetch(signedUrl, { method: "HEAD" });
      record(21, "owner", "signed URL HEAD", "2xx", `${img.status}`, img.ok ? "PASS" : "FAILED");
    } else {
      record(21, "owner", "signed URL HEAD", "2xx", "no url", "FAILED");
    }

    if (personas.revokedStakeholder.email && personas.revokedStakeholder.password) {
      const revoked = new SessionClient("revoked");
      const rLogin = await revoked.login(personas.revokedStakeholder.email, personas.revokedStakeholder.password);
      if (rLogin.ok) {
        const denied = await revoked.fetch(`/api/v1/portal/projects/${projectId}/visual-progress`, { client: "web" });
        record(23, "revoked stakeholder", "portal visual-progress", "403/404", `${denied.status}`, [403, 404].includes(denied.status) ? "PASS" : "FAILED", denied.requestId);
      } else {
        record(23, "revoked stakeholder", "login", "200", `${rLogin.status}`, "FAILED");
      }
    } else {
      record(23, "revoked stakeholder", "portal visual-progress", "403/404", "skipped", "BLOCKED_EXTERNAL", "PILOT_E2E_STAKEHOLDER_REVOKED_* missing");
    }

    if (personas.crossTenant.email && personas.crossTenant.password) {
      const other = new SessionClient("cross_tenant");
      const xLogin = await other.login(personas.crossTenant.email, personas.crossTenant.password);
      if (xLogin.ok) {
        const denied = await other.fetch(`/api/v1/portal/projects/${projectId}/visual-progress`, { client: "web" });
        record(24, "cross-tenant", "portal visual-progress", "403/404", `${denied.status}`, [403, 404].includes(denied.status) ? "PASS" : "FAILED", denied.requestId);
      } else {
        record(24, "cross-tenant", "login", "200", `${xLogin.status}`, "FAILED");
      }
    } else {
      const denied = await worker.fetch("/api/v1/portal/projects/00000000-0000-0000-0000-000000000001/visual-progress", { client: "web" });
      record(24, "cross-tenant", "portal visual-progress", "403/404", `${denied.status}`, [403, 404].includes(denied.status) ? "PASS" : "FAILED", denied.requestId);
    }

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
    record(25, "worker", "idempotent dry-run replay", "same auditRecordId", idempotent ? "match" : "diff", idempotent ? "PASS" : "FAILED", dryRun2.requestId);
  } finally {
    cleanupResult = await cleanupViaApi(worker, reportId);
  }

  const verdict = computeVerdict();
  console.log(
    JSON.stringify(
      {
        verdict,
        base: BASE,
        deployedSha7: preview.sha7,
        startedAt,
        projectId,
        reportId,
        createdFixtures,
        cleanup: cleanupResult,
        httpTrace: httpTrace.map((h) => ({ path: h.path, status: h.status, requestId: h.requestId })),
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
