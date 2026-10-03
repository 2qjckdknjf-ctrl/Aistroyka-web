#!/usr/bin/env node
/**
 * Staging-only stakeholder persona helper.
 * Does not print secrets. Refuses production hosts.
 *
 * Required env (all external, never committed):
 *   PILOT_E2E_BASE_URL          staging origin
 *   E2E_EMAIL / E2E_PASSWORD    contractor persona (manager/owner)
 *   STAKEHOLDER_SMOKE_EMAIL / STAKEHOLDER_SMOKE_PASSWORD  dedicated stakeholder
 *   E2E_PROJECT_ID              project to invite onto
 *   NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY  password grant
 *   STAGING_STAKEHOLDER_PROVISION=YES to mutate staging
 *
 * Usage:
 *   node scripts/pilot/provision_staging_stakeholder_persona.mjs --dry-run
 *   STAGING_STAKEHOLDER_PROVISION=YES node scripts/pilot/provision_staging_stakeholder_persona.mjs
 *   STAGING_STAKEHOLDER_PROVISION=YES node scripts/pilot/provision_staging_stakeholder_persona.mjs --revoke
 */

import { fileURLToPath } from "node:url";
import path from "node:path";

export const PRODUCTION_HOSTS = ["aistroyka.ai", "www.aistroyka.ai"];

function present(v) {
  return Boolean(v && String(v).trim());
}

export function hostOf(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function redactEmail(email) {
  const s = String(email || "");
  const at = s.indexOf("@");
  if (at < 1) return "REDACTED";
  return `${s[0]}***${s.slice(at)}`;
}

function jsonOf(res) {
  return res.text().then((text) => {
    try {
      return { status: res.status, ok: res.ok, body: text ? JSON.parse(text) : null };
    } catch {
      return { status: res.status, ok: res.ok, body: null };
    }
  });
}

export function evaluateProvisionPlan({ argv = [], env = {} } = {}) {
  const dryRun = argv.includes("--dry-run") || env.STAGING_STAKEHOLDER_PROVISION !== "YES";
  const revokeOnly = argv.includes("--revoke") || argv.includes("--reset");
  const base = env.PILOT_E2E_BASE_URL || env.STAKEHOLDER_FINANCE_BASE_URL || "";
  const contractorEmail = env.E2E_EMAIL || env.PILOT_E2E_EMAIL || "";
  const contractorPassword = env.E2E_PASSWORD || env.PILOT_E2E_PASSWORD || "";
  const stakeholderEmail = env.STAKEHOLDER_SMOKE_EMAIL || "";
  const stakeholderPassword = env.STAKEHOLDER_SMOKE_PASSWORD || "";
  const projectId = env.E2E_PROJECT_ID || env.PILOT_E2E_PROJECT_ID || "";
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || "";
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || "";
  const host = hostOf(base);

  if (!host) {
    return { status: "BLOCKED", reason: "PILOT_E2E_BASE_URL missing", dryRun, revokeOnly, host };
  }
  if (PRODUCTION_HOSTS.includes(host)) {
    return { status: "BLOCKED", reason: "production host refused", dryRun, revokeOnly, host };
  }
  if (contractorEmail && stakeholderEmail && contractorEmail.toLowerCase() === stakeholderEmail.toLowerCase()) {
    return {
      status: "BLOCKED",
      reason: "contractor and stakeholder emails must be distinct personas",
      dryRun,
      revokeOnly,
      host,
    };
  }
  if (!present(contractorEmail) || !present(stakeholderEmail) || !present(projectId)) {
    return {
      status: "BLOCKED_EXTERNAL",
      reason: "dedicated personas or project id missing from env",
      dryRun,
      revokeOnly,
      host,
      contractorEmail,
      stakeholderEmail,
      projectId,
    };
  }
  if (dryRun) {
    return {
      status: "DRY_RUN",
      reason: "invite via POST /api/v1/projects/:id/stakeholders then accept as stakeholder",
      dryRun: true,
      revokeOnly,
      host,
      contractorEmail,
      stakeholderEmail,
      projectId,
    };
  }
  if (!present(contractorPassword) || !present(stakeholderPassword) || !present(supabaseUrl) || !present(anonKey)) {
    return {
      status: "BLOCKED_EXTERNAL",
      reason: "password-grant credentials missing (contractor/stakeholder password or Supabase anon config)",
      dryRun: false,
      revokeOnly,
      host,
      contractorEmail,
      stakeholderEmail,
      projectId,
    };
  }
  return {
    status: "READY",
    reason: revokeOnly ? "revoke existing stakeholder membership" : "invite-and-accept",
    dryRun: false,
    revokeOnly,
    host,
    base,
    contractorEmail,
    contractorPassword,
    stakeholderEmail,
    stakeholderPassword,
    projectId,
    supabaseUrl,
    anonKey,
  };
}

async function passwordGrant(fetchImpl, { supabaseUrl, anonKey, email, password }) {
  const res = await fetchImpl(`${String(supabaseUrl).replace(/\/$/, "")}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: anonKey },
    body: JSON.stringify({ email, password }),
  });
  const parsed = await jsonOf(res);
  const token = parsed.body?.access_token;
  if (!parsed.ok || !token) {
    return { error: `password grant failed (${parsed.status})`, token: "" };
  }
  return { error: "", token };
}

async function api(fetchImpl, { base, token, method, path, body, extraHeaders = {} }) {
  const res = await fetchImpl(`${String(base).replace(/\/$/, "")}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Origin: String(base).replace(/\/$/, ""),
      ...extraHeaders,
    },
    body: body == null ? undefined : JSON.stringify(body),
  });
  return jsonOf(res);
}

async function resolveProjectTenantId(fetchImpl, plan, contractorToken) {
  const project = await api(fetchImpl, {
    base: plan.base,
    token: contractorToken,
    method: "GET",
    path: `/api/v1/projects/${plan.projectId}`,
  });
  const tenantId = project.body?.data?.tenant_id || project.body?.tenant_id || "";
  return { tenantId: String(tenantId || ""), status: project.status };
}

async function verifyActiveStakeholderPersona(fetchImpl, plan, { contractorToken, stakeholderToken, lines }) {
  const verified = await api(fetchImpl, {
    base: plan.base,
    token: contractorToken,
    method: "GET",
    path: `/api/v1/projects/${plan.projectId}/stakeholders`,
  });
  const verifiedRow = findStakeholder(verified.body?.data, plan.stakeholderEmail);
  if (verifiedRow?.status !== "active") {
    return { exitCode: 1, status: "ERROR", reason: "membership verify failed", lines };
  }

  const portalMe = await api(fetchImpl, {
    base: plan.base,
    token: stakeholderToken,
    method: "GET",
    path: "/api/v1/me",
  });
  const role = portalMe.body?.data?.role ?? portalMe.body?.role;
  if (!portalMe.ok || role !== "stakeholder") {
    return {
      exitCode: 1,
      status: "ERROR",
      reason: `portal-only verify failed (${portalMe.status})`,
      lines,
    };
  }

  const { tenantId } = await resolveProjectTenantId(fetchImpl, plan, contractorToken);
  if (!tenantId) {
    return { exitCode: 1, status: "ERROR", reason: "project tenant_id lookup failed", lines };
  }

  const intakeOk = await api(fetchImpl, {
    base: plan.base,
    token: stakeholderToken,
    method: "GET",
    path: "/api/v1/portal/intake",
    extraHeaders: { "x-tenant-id": tenantId },
  });
  if (!intakeOk.ok) {
    return {
      exitCode: 1,
      status: "ERROR",
      reason: `active stakeholder projectless intake failed (${intakeOk.status})`,
      lines,
    };
  }

  return { exitCode: 0, status: "SUCCESS", reason: "", lines };
}

async function assertRevokedCannotWriteIntake(fetchImpl, plan, { contractorToken, stakeholderToken, lines }) {
  const { tenantId, status } = await resolveProjectTenantId(fetchImpl, plan, contractorToken);
  if (!tenantId) {
    return {
      exitCode: 1,
      status: "ERROR",
      reason: `project tenant_id lookup failed (${status})`,
      lines,
    };
  }
  const intakeDenied = await api(fetchImpl, {
    base: plan.base,
    token: stakeholderToken,
    method: "POST",
    path: "/api/v1/portal/intake",
    extraHeaders: { "x-tenant-id": tenantId },
    body: { title: "Revoked persona check", description: "Must fail after revoke" },
  });
  if (intakeDenied.status === 401 || intakeDenied.status === 403) {
    return { exitCode: 0, status: "SUCCESS", reason: "stakeholder revoked", lines };
  }
  if (intakeDenied.status >= 200 && intakeDenied.status < 300) {
    return {
      exitCode: 1,
      status: "ERROR",
      reason: "revoked stakeholder still wrote projectless intake",
      lines,
    };
  }
  return {
    exitCode: 1,
    status: "ERROR",
    reason: `revoked intake probe unexpected status (${intakeDenied.status})`,
    lines,
  };
}

function findStakeholder(list, email) {
  const want = String(email).trim().toLowerCase();
  const rows = Array.isArray(list) ? list : [];
  return rows.find((row) => String(row?.email || "").trim().toLowerCase() === want) || null;
}

export async function provisionStagingStakeholder({ env = process.env, argv = process.argv, fetchImpl = fetch } = {}) {
  const plan = evaluateProvisionPlan({ argv, env });
  const lines = [
    `BASE_HOST: ${plan.host || "MISSING"}`,
    `CONTRACTOR_EMAIL: ${present(plan.contractorEmail) ? redactEmail(plan.contractorEmail) : "MISSING"}`,
    `STAKEHOLDER_EMAIL: ${present(plan.stakeholderEmail) ? redactEmail(plan.stakeholderEmail) : "MISSING"}`,
    `PROJECT_ID: ${present(plan.projectId) ? "PRESENT" : "MISSING"}`,
    `CONTRACTOR_PASSWORD: ${present(plan.contractorPassword) ? "PRESENT" : "MISSING"}`,
    `STAKEHOLDER_PASSWORD: ${present(plan.stakeholderPassword) ? "PRESENT" : "MISSING"}`,
  ];
  if (plan.status !== "READY") {
    return { exitCode: plan.status === "DRY_RUN" ? 0 : 1, status: plan.status, reason: plan.reason, lines };
  }

  const contractor = await passwordGrant(fetchImpl, {
    supabaseUrl: plan.supabaseUrl,
    anonKey: plan.anonKey,
    email: plan.contractorEmail,
    password: plan.contractorPassword,
  });
  if (contractor.error) {
    return { exitCode: 1, status: "BLOCKED_EXTERNAL", reason: contractor.error, lines };
  }

  const listed = await api(fetchImpl, {
    base: plan.base,
    token: contractor.token,
    method: "GET",
    path: `/api/v1/projects/${plan.projectId}/stakeholders`,
  });
  if (!listed.ok) {
    return {
      exitCode: 1,
      status: "ERROR",
      reason: `contractor stakeholder list failed (${listed.status})`,
      lines,
    };
  }
  let row = findStakeholder(listed.body?.data, plan.stakeholderEmail);

  if (plan.revokeOnly) {
    if (!row) {
      return { exitCode: 0, status: "SUCCESS", reason: "no stakeholder membership to revoke", lines };
    }
    const revoked = await api(fetchImpl, {
      base: plan.base,
      token: contractor.token,
      method: "PATCH",
      path: `/api/v1/projects/${plan.projectId}/stakeholders/${row.id}`,
      body: { action: "revoke" },
    });
    if (!revoked.ok) {
      return { exitCode: 1, status: "ERROR", reason: `revoke failed (${revoked.status})`, lines };
    }
    const stakeholder = await passwordGrant(fetchImpl, {
      supabaseUrl: plan.supabaseUrl,
      anonKey: plan.anonKey,
      email: plan.stakeholderEmail,
      password: plan.stakeholderPassword,
    });
    if (stakeholder.error) {
      return { exitCode: 1, status: "BLOCKED_EXTERNAL", reason: stakeholder.error, lines };
    }
    const denied = await assertRevokedCannotWriteIntake(fetchImpl, plan, {
      contractorToken: contractor.token,
      stakeholderToken: stakeholder.token,
      lines,
    });
    if (denied.exitCode !== 0) return denied;
    return { exitCode: 0, status: "SUCCESS", reason: "stakeholder revoked", lines };
  }

  if (row?.status === "active") {
    const stakeholder = await passwordGrant(fetchImpl, {
      supabaseUrl: plan.supabaseUrl,
      anonKey: plan.anonKey,
      email: plan.stakeholderEmail,
      password: plan.stakeholderPassword,
    });
    if (stakeholder.error) {
      return { exitCode: 1, status: "BLOCKED_EXTERNAL", reason: stakeholder.error, lines };
    }
    const verified = await verifyActiveStakeholderPersona(fetchImpl, plan, {
      contractorToken: contractor.token,
      stakeholderToken: stakeholder.token,
      lines,
    });
    if (verified.exitCode !== 0) return verified;
    return { exitCode: 0, status: "SUCCESS", reason: "stakeholder already active (idempotent)", lines };
  }

  if (row && row.status !== "revoked") {
    const revoked = await api(fetchImpl, {
      base: plan.base,
      token: contractor.token,
      method: "PATCH",
      path: `/api/v1/projects/${plan.projectId}/stakeholders/${row.id}`,
      body: { action: "revoke" },
    });
    if (!revoked.ok) {
      return { exitCode: 1, status: "ERROR", reason: `reset-revoke failed (${revoked.status})`, lines };
    }
  }

  const invited = await api(fetchImpl, {
    base: plan.base,
    token: contractor.token,
    method: "POST",
    path: `/api/v1/projects/${plan.projectId}/stakeholders`,
    body: { email: plan.stakeholderEmail, stakeholder_role: "client_viewer" },
  });
  const token = invited.body?.data?.token;
  if (!invited.ok || !token) {
    return { exitCode: 1, status: "ERROR", reason: `invite failed (${invited.status})`, lines };
  }

  const stakeholder = await passwordGrant(fetchImpl, {
    supabaseUrl: plan.supabaseUrl,
    anonKey: plan.anonKey,
    email: plan.stakeholderEmail,
    password: plan.stakeholderPassword,
  });
  if (stakeholder.error) {
    return { exitCode: 1, status: "BLOCKED_EXTERNAL", reason: stakeholder.error, lines };
  }

  const accepted = await api(fetchImpl, {
    base: plan.base,
    token: stakeholder.token,
    method: "POST",
    path: "/api/v1/stakeholder-invites/accept",
    body: { token },
  });
  if (!accepted.ok) {
    return { exitCode: 1, status: "ERROR", reason: `accept failed (${accepted.status})`, lines };
  }

  const verified = await verifyActiveStakeholderPersona(fetchImpl, plan, {
    contractorToken: contractor.token,
    stakeholderToken: stakeholder.token,
    lines,
  });
  if (verified.exitCode !== 0) return verified;

  return { exitCode: 0, status: "SUCCESS", reason: "stakeholder invited and accepted", lines };
}

async function main() {
  const result = await provisionStagingStakeholder({ env: process.env, argv: process.argv, fetchImpl: fetch });
  for (const line of result.lines) console.log(line);
  console.log("STATUS:", result.status);
  if (result.reason) console.log("REASON:", result.reason);
  if (result.status === "DRY_RUN") {
    console.log("NEXT: STAGING_STAKEHOLDER_PROVISION=YES to invite-and-accept");
    console.log("REVOKE: STAGING_STAKEHOLDER_PROVISION=YES ... --revoke");
  }
  process.exit(result.exitCode);
}

const invoked = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invoked && path.resolve(fileURLToPath(import.meta.url)) === invoked) {
  main().catch((err) => {
    console.log("STATUS: ERROR");
    console.log("REASON:", err instanceof Error ? err.message : "unknown");
    process.exit(1);
  });
}
