/**
 * Phase 3E multi-role credential + runtime role preflight.
 * Exit 0 only after sanitized runtime proof for all personas.
 * Exit 2 = BLOCKED_EXTERNAL.
 * Never prints emails, IDs, JWTs, or secrets.
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../../..");
const webRoot = path.resolve(__dirname, "../..");

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

function isLoopback(url) {
  return /localhost|127\.0\.0\.1|\[::1\]/.test(url || "");
}

function jwtRef(jwt) {
  try {
    const payload = JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString("utf8"));
    return typeof payload.ref === "string" ? payload.ref : null;
  } catch {
    return null;
  }
}

function hostRef(url) {
  try {
    const m = new URL(url).hostname.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

async function fetchMe(baseUrl, accessToken) {
  const res = await fetch(`${baseUrl}/api/v1/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function signInWithRetry(anon, email, password, attempts = 4) {
  let lastErr = null;
  for (let i = 0; i < attempts; i++) {
    const { data: auth, error } = await anon.auth.signInWithPassword({ email, password });
    if (!error && auth?.user && auth.session?.access_token) return { auth, error: null };
    lastErr = error;
    await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
  }
  return { auth: null, error: lastErr || new Error("sign-in failed") };
}

async function provePersona(label, anon, admin, baseUrl, email, password, expectations) {
  const { auth, error } = await signInWithRetry(anon, email, password);
  console.log(`${label}_LOGIN:`, error || !auth?.user ? "FAIL" : "OK");
  if (error || !auth?.user || !auth.session?.access_token) {
    throw new Error(`${label} login failed`);
  }
  const me = await fetchMe(baseUrl, auth.session.access_token);
  const role = me.body?.data?.role || null;
  const tenant = me.body?.data?.tenant_id || null;
  console.log(`${label}_ME_STATUS:`, me.status);
  console.log(`${label}_TENANT_ROLE:`, role || "NULL");
  console.log(`${label}_TENANT:`, present(tenant) ? "PRESENT" : "MISSING");
  if (me.status !== 200 || role !== expectations.tenantRole) {
    throw new Error(`${label} tenant role mismatch`);
  }
  if (expectations.requireTenantMatch && tenant !== expectations.activeTenantId) {
    throw new Error(`${label} active tenant mismatch`);
  }

  const { data: grant } = await admin
    .from("platform_owner_grants")
    .select("role")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  const grantState = grant?.role || "ABSENT";
  console.log(`${label}_PLATFORM_GRANT:`, grantState);
  if (expectations.grant === "ABSENT") {
    if (grant) throw new Error(`${label} unexpected platform grant`);
  } else if (grantState !== expectations.grant) {
    throw new Error(`${label} grant role mismatch`);
  }

  if (expectations.projectRole) {
    const { data: pm } = await admin
      .from("project_members")
      .select("role, status")
      .eq("project_id", expectations.projectId)
      .eq("user_id", auth.user.id)
      .eq("tenant_id", expectations.activeTenantId)
      .maybeSingle();
    console.log(`${label}_PROJECT_ROLE:`, pm?.role || "ABSENT");
    console.log(`${label}_PROJECT_STATUS:`, pm?.status || "ABSENT");
    if (!pm || pm.role !== expectations.projectRole || pm.status !== "active") {
      throw new Error(`${label} project membership mismatch`);
    }
  }

  if (expectations.requireStakeholder) {
    const { data: st } = await admin
      .from("project_stakeholders")
      .select("id, status, stakeholder_role")
      .eq("project_id", expectations.projectId)
      .eq("user_id", auth.user.id)
      .eq("status", "active")
      .maybeSingle();
    console.log(`${label}_STAKEHOLDER:`, st ? "ACTIVE" : "ABSENT");
    console.log(`${label}_STAKEHOLDER_ROLE:`, st?.stakeholder_role || "ABSENT");
    if (!st || st.stakeholder_role !== "client_viewer") {
      throw new Error(`${label} stakeholder row missing`);
    }
    const { data: pm } = await admin
      .from("project_members")
      .select("user_id")
      .eq("project_id", expectations.projectId)
      .eq("user_id", auth.user.id)
      .maybeSingle();
    console.log(`${label}_PROJECT_MEMBERS:`, pm ? "PRESENT" : "ABSENT");
    if (pm) throw new Error(`${label} must not have project_members`);
  }

  await anon.auth.signOut();
  return { userId: auth.user.id, tenantId: tenant, role };
}

async function main() {
  const env = mergeEnv();
  const baseUrl = (env.PLAYWRIGHT_BASE_URL || env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");

  console.log("PLAYWRIGHT_BASE_URL:", present(env.PLAYWRIGHT_BASE_URL) ? "PRESENT" : "MISSING");
  console.log("BASE_URL_KIND:", isLoopback(baseUrl) ? "loopback" : present(baseUrl) ? "remote" : "MISSING");
  console.log("SUPABASE_URL:", present(env.NEXT_PUBLIC_SUPABASE_URL) ? "PRESENT" : "MISSING");
  console.log(
    "SERVICE_ROLE:",
    present(env.SUPABASE_SERVICE_ROLE_KEY) && String(env.SUPABASE_SERVICE_ROLE_KEY).includes(".")
      ? "JWT_PRESENT"
      : "MISSING_OR_PLACEHOLDER"
  );
  console.log("E2E_PROJECT_ID:", present(env.E2E_PROJECT_ID) ? "PRESENT" : "MISSING");
  console.log("E2E_DEVICE_ID:", present(env.E2E_DEVICE_ID) ? "PRESENT" : "MISSING");

  const pairs = [
    ["SMOKE_EMAIL", "SMOKE_PASSWORD"],
    ["QA_OWNER_EMAIL", "QA_OWNER_PASSWORD"],
    ["QA_MANAGER_EMAIL", "QA_MANAGER_PASSWORD"],
    ["QA_WORKER_EMAIL", "QA_WORKER_PASSWORD"],
    ["QA_CLIENT_EMAIL", "QA_CLIENT_PASSWORD"],
  ];
  for (const [ek, pk] of pairs) {
    console.log(`${ek}:`, present(env[ek]) ? "PRESENT" : "MISSING");
    console.log(`${pk}:`, present(env[pk]) ? "PRESENT" : "MISSING");
  }

  if (!present(baseUrl) || !isLoopback(baseUrl)) {
    console.log("PREFLIGHT_BLOCKED: loopback PLAYWRIGHT_BASE_URL required.");
    process.exit(2);
  }
  if (
    !present(env.NEXT_PUBLIC_SUPABASE_URL) ||
    !present(env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    !present(env.SUPABASE_SERVICE_ROLE_KEY) ||
    !String(env.SUPABASE_SERVICE_ROLE_KEY).includes(".")
  ) {
    console.log("PREFLIGHT_BLOCKED: Supabase URL/anon/JWT service-role incomplete.");
    process.exit(2);
  }
  for (const [ek, pk] of pairs) {
    if (!present(env[ek]) || !present(env[pk])) {
      console.log("PREFLIGHT_BLOCKED: incomplete credential pairs.");
      process.exit(2);
    }
  }
  if (!present(env.E2E_PROJECT_ID) || !present(env.E2E_DEVICE_ID)) {
    console.log("PREFLIGHT_BLOCKED: E2E_PROJECT_ID / E2E_DEVICE_ID missing.");
    process.exit(2);
  }

  const emails = pairs.map(([ek]) => env[ek].trim().toLowerCase());
  if (new Set(emails).size !== emails.length) {
    console.log("PREFLIGHT_BLOCKED: personas must be distinct auth users.");
    process.exit(2);
  }

  const urlRef = hostRef(env.NEXT_PUBLIC_SUPABASE_URL);
  const anonRef = jwtRef(env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const serviceRef = jwtRef(env.SUPABASE_SERVICE_ROLE_KEY);
  const refsMatch = urlRef && anonRef && serviceRef && urlRef === anonRef && anonRef === serviceRef;
  console.log("REFS_MATCH:", refsMatch ? "YES" : "NO");
  console.log("REF_EQUALS_AISTROYKA:", urlRef === "vthfrxehrursfloevnlp" ? "YES" : "NO");
  if (!refsMatch || urlRef !== "vthfrxehrursfloevnlp") {
    console.log("PREFLIGHT_BLOCKED: supabase refs mismatch or not AISTROYKA cloud.");
    process.exit(2);
  }

  try {
    const h = await fetch(`${baseUrl}/api/v1/health`, { signal: AbortSignal.timeout(8000) });
    console.log("HEALTH:", h.ok ? "OK" : "FAIL");
    if (!h.ok) {
      console.log("PREFLIGHT_BLOCKED: local health unavailable.");
      process.exit(2);
    }
  } catch {
    console.log("HEALTH: FAIL");
    console.log("PREFLIGHT_BLOCKED: local health unavailable.");
    process.exit(2);
  }

  const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const smoke = await provePersona(
      "SMOKE",
      anon,
      admin,
      baseUrl,
      env.SMOKE_EMAIL.trim(),
      env.SMOKE_PASSWORD,
      { tenantRole: "admin", grant: "OWNER", requireTenantMatch: false }
    );
    const activeTenantId = smoke.tenantId;
    if (!activeTenantId) throw new Error("smoke active tenant missing");

    const { data: project, error: projErr } = await admin
      .from("projects")
      .select("id, name, tenant_id, client_portal_enabled, client_show_budget_summary")
      .eq("id", env.E2E_PROJECT_ID.trim())
      .maybeSingle();
    console.log("TEMP_PROJECT_QUERY:", projErr ? "ERROR" : "OK");
    console.log("TEMP_PROJECT:", project ? "PRESENT" : "ABSENT");
    console.log("TEMP_PROJECT_TENANT_MATCH:", project?.tenant_id === activeTenantId ? "YES" : "NO");
    console.log("TEMP_PORTAL_ENABLED:", project?.client_portal_enabled === true ? "YES" : "NO");
    console.log(
      "TEMP_BUDGET_SUMMARY:",
      project?.client_show_budget_summary === false ? "DISABLED" : "UNEXPECTED"
    );
    console.log(
      "TEMP_PROJECT_NAME_PREFIX:",
      typeof project?.name === "string" && project.name.startsWith("PHASE3E TEMP ") ? "YES" : "NO"
    );
    if (
      !project ||
      project.tenant_id !== activeTenantId ||
      project.client_portal_enabled !== true ||
      project.client_show_budget_summary !== false ||
      !String(project.name || "").startsWith("PHASE3E TEMP ")
    ) {
      throw new Error("temporary project proof failed");
    }

    const { data: handover } = await admin
      .from("project_handover")
      .select("id, status")
      .eq("project_id", project.id)
      .eq("tenant_id", activeTenantId)
      .maybeSingle();
    console.log("TEMP_HANDOVER:", handover ? "PRESENT" : "ABSENT");
    console.log("TEMP_HANDOVER_STATUS:", handover?.status || "ABSENT");
    if (!handover || handover.status !== "in_progress") throw new Error("handover proof failed");

    const { count: taskCount } = await admin
      .from("worker_tasks")
      .select("id", { count: "exact", head: true })
      .eq("project_id", project.id);
    console.log("TEMP_TASK_ROWS:", typeof taskCount === "number" ? taskCount : "UNKNOWN");
    if ((taskCount ?? 0) > 0) throw new Error("unexpected tasks on temporary project");

    await provePersona("ADMIN", anon, admin, baseUrl, env.QA_OWNER_EMAIL.trim(), env.QA_OWNER_PASSWORD, {
      tenantRole: "admin",
      grant: "ABSENT",
      requireTenantMatch: true,
      activeTenantId,
      projectId: project.id,
      projectRole: "owner",
    });
    await provePersona(
      "MANAGER",
      anon,
      admin,
      baseUrl,
      env.QA_MANAGER_EMAIL.trim(),
      env.QA_MANAGER_PASSWORD,
      {
        tenantRole: "member",
        grant: "ABSENT",
        requireTenantMatch: true,
        activeTenantId,
        projectId: project.id,
        projectRole: "manager",
      }
    );
    await provePersona("WORKER", anon, admin, baseUrl, env.QA_WORKER_EMAIL.trim(), env.QA_WORKER_PASSWORD, {
      tenantRole: "member",
      grant: "ABSENT",
      requireTenantMatch: true,
      activeTenantId,
      projectId: project.id,
      projectRole: "worker",
    });
    await provePersona(
      "STAKEHOLDER",
      anon,
      admin,
      baseUrl,
      env.QA_CLIENT_EMAIL.trim(),
      env.QA_CLIENT_PASSWORD,
      {
        tenantRole: "stakeholder",
        grant: "ABSENT",
        requireTenantMatch: true,
        activeTenantId,
        projectId: project.id,
        requireStakeholder: true,
      }
    );

    console.log("PREFLIGHT_OK: five distinct personas + temporary project runtime-proven.");
    process.exit(0);
  } catch (e) {
    console.log("PREFLIGHT_BLOCKED:", String(e?.message || e).slice(0, 160));
    process.exit(2);
  }
}

main().catch((e) => {
  console.log("PREFLIGHT_BLOCKED: unexpected error:", String(e?.message || e).slice(0, 120));
  process.exit(2);
});
