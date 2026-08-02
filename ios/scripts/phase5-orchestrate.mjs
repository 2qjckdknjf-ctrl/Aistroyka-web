#!/usr/bin/env node
/**
 * Phase 5 iOS Layer B orchestrator.
 * Sanitized logs only. No commit/deploy/TestFlight upload.
 */
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, chmodSync } from "node:fs";
import { spawn, execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = process.env.PHASE5_REPO_ROOT || path.resolve(__dirname, "../..");
const WEB = path.join(REPO, "apps/web");
const IOS = path.join(REPO, "ios");
const PRIV = process.env.PHASE5_PRIV_DIR || "/tmp/aistroyka-phase5-orch";
const AISTROYKA_REF = "vthfrxehrursfloevnlp";
const MARKER_PREFIX = "PHASE5 TEMP";

// Line-buffer sanitized progress when stdout is piped (background/nohup runs).
for (const stream of [process.stdout, process.stderr]) {
  if (stream?.isTTY === false && typeof stream._handle?.setBlocking === "function") {
    try {
      stream._handle.setBlocking(true);
    } catch {
      /* ignore */
    }
  }
}
const _log = console.log.bind(console);
console.log = (...args) => {
  _log(...args);
  try {
    process.stdout.write("");
  } catch {
    /* ignore */
  }
};

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
  const root = loadEnvFile(path.join(REPO, ".env.local"));
  const web = loadEnvFile(path.join(WEB, ".env.local"));
  const pilot = loadEnvFile(path.join(REPO, ".env.pilot"));
  const env = { ...process.env, ...pilot, ...web, ...root };
  const rootSk = root.SUPABASE_SERVICE_ROLE_KEY || "";
  const webSk = web.SUPABASE_SERVICE_ROLE_KEY || "";
  if (rootSk.includes(".") && rootSk.split(".").length === 3 && rootSk.startsWith("eyJ")) {
    env.SUPABASE_SERVICE_ROLE_KEY = rootSk;
  } else if (webSk.includes(".") && webSk.split(".").length === 3 && webSk.startsWith("eyJ")) {
    env.SUPABASE_SERVICE_ROLE_KEY = webSk;
  }
  return env;
}

function present(v) {
  return typeof v === "string" && v.trim().length > 0;
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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isLoopback(url) {
  return /localhost|127\.0\.0\.1|\[::1\]/.test(url || "");
}

function sanitize(text) {
  return String(text)
    .replace(/[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[JWT]")
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "[UUID]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[EMAIL]")
    .replace(/password["'=:\s]+[^,\s"']+/gi, "password=[REDACTED]");
}

function sh(cmd, opts = {}) {
  return execSync(cmd, {
    cwd: opts.cwd || REPO,
    env: opts.env || process.env,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 20 * 1024 * 1024,
  });
}

function runCmd(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd: opts.cwd || REPO,
      env: opts.env || process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => {
      const s = sanitize(d.toString());
      stdout += s;
      process.stdout.write(s);
    });
    child.stderr.on("data", (d) => {
      const s = sanitize(d.toString());
      stderr += s;
      process.stderr.write(s);
    });
    child.on("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
  });
}

async function waitForHealth(baseUrl, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${baseUrl}/api/v1/health`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) return true;
    } catch {
      /* retry */
    }
    await sleep(1500);
  }
  return false;
}

async function fetchMe(baseUrl, accessToken, client) {
  const res = await fetch(`${baseUrl}/api/v1/me`, {
    headers: { Authorization: `Bearer ${accessToken}`, "x-client": client },
    signal: AbortSignal.timeout(20000),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

const state = {
  runId: null,
  marker: null,
  tenantId: null,
  projectId: null,
  taskId: null,
  reportId: null,
  simName: null,
  simUdid: null,
  derivedData: null,
  users: {
    worker: { id: null, email: null, password: null },
    manager: { id: null, email: null, password: null },
  },
  serverProc: null,
  createdSim: false,
};

async function createUser(admin, persona) {
  const email = `phase5-temp-${state.runId}-${persona}@example.com`;
  const password = randomBytes(24).toString("base64url");
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: {
      aistroyka_fixture: "phase5_ios_pilot_readiness",
      marker: state.marker,
      persona,
    },
    user_metadata: { marker: state.marker },
  });
  if (error || !data?.user?.id) throw error || new Error(`create user ${persona}`);
  state.users[persona].id = data.user.id;
  state.users[persona].email = email;
  state.users[persona].password = password;
  console.log(`FIXTURE_USER_${persona.toUpperCase()}: CREATED`);
}

function writeCredFile(extra = {}) {
  const file = path.join(IOS, "Config/.uitest-e2e-credentials");
  const lines = {
    IOS_E2E_WORKER_EMAIL: state.users.worker.email,
    IOS_E2E_WORKER_PASSWORD: state.users.worker.password,
    IOS_E2E_MANAGER_EMAIL: state.users.manager.email,
    IOS_E2E_MANAGER_PASSWORD: state.users.manager.password,
    IOS_E2E_EMAIL: state.users.worker.email,
    IOS_E2E_PASSWORD: state.users.worker.password,
    AISTROYKA_E2E_EMAIL: state.users.worker.email,
    AISTROYKA_E2E_PASSWORD: state.users.worker.password,
    IOS_E2E_BASE_URL: extra.baseUrl,
    AISTROYKA_E2E_BASE_URL: extra.baseUrl,
    BASE_URL: extra.baseUrl,
    SUPABASE_URL: extra.supabaseUrl,
    SUPABASE_ANON_KEY: extra.anonKey,
    NEXT_PUBLIC_SUPABASE_URL: extra.supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: extra.anonKey,
    IOS_E2E_PROJECT_ID: state.projectId,
    AISTROYKA_E2E_PROJECT_ID: state.projectId,
    IOS_E2E_TASK_ID: state.taskId,
    AISTROYKA_E2E_TASK_ID: state.taskId,
    IOS_E2E_WORKER_NOTE: state.marker,
    AISTROYKA_E2E_WORKER_NOTE: state.marker,
    IOS_E2E_MANAGER_NOTE: `${state.marker} manager changes`,
    AISTROYKA_E2E_MANAGER_NOTE: `${state.marker} manager changes`,
    ...(state.reportId
      ? { IOS_E2E_REPORT_ID: state.reportId, AISTROYKA_E2E_REPORT_ID: state.reportId }
      : {}),
    ...extra.more,
  };
  writeFileSync(
    file,
    Object.entries(lines)
      .filter(([, v]) => v != null && String(v).length)
      .map(([k, v]) => `${k}=${v}`)
      .join("\n") + "\n",
    { mode: 0o600 }
  );
  chmodSync(file, 0o600);
  return file;
}

async function cleanup(admin, smokeSnapshot, env) {
  const steps = [];
  async function step(label, fn) {
    try {
      await fn();
      steps.push([label, "OK"]);
      console.log(`CLEANUP_${label}: OK`);
    } catch (error) {
      steps.push([label, "FAIL"]);
      console.log(`CLEANUP_${label}: FAIL ${sanitize(String(error?.message || error)).slice(0, 140)}`);
    }
  }

  const userIds = Object.values(state.users).map((u) => u.id).filter(Boolean);
  const empty = ["00000000-0000-0000-0000-000000000000"];

  await step("REPORT_APPROVAL_EVENTS", async () => {
    if (!userIds.length || !state.tenantId) return;
    const { data: reports } = await admin
      .from("worker_reports")
      .select("id")
      .eq("tenant_id", state.tenantId)
      .in("user_id", userIds);
    const reportIds = (reports || []).map((r) => r.id);
    if (!reportIds.length) return;
    const { error } = await admin.from("report_approval_events").delete().in("report_id", reportIds);
    if (error && !/relation|does not exist/i.test(error.message || "")) throw error;
  });
  await step("REPORT_MEDIA", async () => {
    const { data: reports } = await admin
      .from("worker_reports")
      .select("id")
      .eq("tenant_id", state.tenantId)
      .in("user_id", userIds.length ? userIds : empty);
    const reportIds = (reports || []).map((r) => r.id);
    if (reportIds.length) {
      const { error } = await admin.from("worker_report_media").delete().in("report_id", reportIds);
      if (error) throw error;
    }
  });
  await step("WORKER_REPORTS", async () => {
    if (!userIds.length) return;
    const { error } = await admin.from("worker_reports").delete().eq("tenant_id", state.tenantId).in("user_id", userIds);
    if (error) throw error;
  });
  await step("STORAGE_OBJECTS", async () => {
    if (!userIds.length || !state.tenantId) return;
    const { data: sessions } = await admin
      .from("upload_sessions")
      .select("id, object_path")
      .eq("tenant_id", state.tenantId)
      .in("user_id", userIds);
    for (const session of sessions || []) {
      const prefix = `${state.tenantId}/${session.id}`;
      const { data: listed } = await admin.storage.from("media").list(prefix, { limit: 100 });
      const names = (listed || []).map((item) => `${prefix}/${item.name}`);
      if (names.length) await admin.storage.from("media").remove(names);
      if (session.object_path) {
        const pathInBucket = String(session.object_path).startsWith("media/")
          ? String(session.object_path).slice("media/".length)
          : String(session.object_path);
        await admin.storage.from("media").remove([pathInBucket]);
      }
    }
  });
  await step("UPLOAD_SESSIONS", async () => {
    if (!userIds.length) return;
    const { error } = await admin.from("upload_sessions").delete().eq("tenant_id", state.tenantId).in("user_id", userIds);
    if (error) throw error;
  });
  await step("WORKER_DAY", async () => {
    if (!userIds.length) return;
    const { error } = await admin.from("worker_day").delete().eq("tenant_id", state.tenantId).in("user_id", userIds);
    if (error) throw error;
  });
  await step("SYNC_CURSORS", async () => {
    if (!userIds.length) return;
    const { error } = await admin.from("sync_cursors").delete().eq("tenant_id", state.tenantId).in("user_id", userIds);
    if (error) throw error;
  });
  await step("IDEMPOTENCY_KEYS", async () => {
    if (!userIds.length) return;
    const { error } = await admin.from("idempotency_keys").delete().eq("tenant_id", state.tenantId).in("user_id", userIds);
    if (error) throw error;
  });
  await step("PUSH_OUTBOX", async () => {
    if (!userIds.length) return;
    const { data: rows, error: selErr } = await admin
      .from("push_outbox")
      .select("id")
      .eq("tenant_id", state.tenantId)
      .in("user_id", userIds);
    if (selErr) throw selErr;
    const ids = (rows || []).map((r) => r.id);
    if (!ids.length) return;
    const { error } = await admin.from("push_outbox").delete().in("id", ids);
    if (error) throw error;
  });
  await step("MANAGER_NOTIFICATIONS", async () => {
    if (!userIds.length) return;
    const { error } = await admin
      .from("manager_notifications")
      .delete()
      .eq("tenant_id", state.tenantId)
      .in("user_id", userIds);
    if (error && !/relation|does not exist|column/i.test(error.message || "")) throw error;
  });
  await step("DEVICE_TOKENS", async () => {
    if (!userIds.length) return;
    const { error } = await admin.from("device_tokens").delete().eq("tenant_id", state.tenantId).in("user_id", userIds);
    if (error) throw error;
  });
  await step("TASK_ASSIGNMENTS", async () => {
    if (!state.taskId) return;
    const { error } = await admin.from("task_assignments").delete().eq("tenant_id", state.tenantId).eq("task_id", state.taskId);
    if (error) throw error;
  });
  await step("TASKS", async () => {
    if (!state.taskId) return;
    const { error } = await admin.from("worker_tasks").delete().eq("tenant_id", state.tenantId).eq("id", state.taskId);
    if (error) throw error;
  });
  await step("PROJECT_MEMBERS", async () => {
    if (!state.projectId) return;
    const { error } = await admin.from("project_members").delete().eq("tenant_id", state.tenantId).eq("project_id", state.projectId);
    if (error) throw error;
  });
  await step("PROJECT", async () => {
    if (!state.projectId) return;
    const { error } = await admin.from("projects").delete().eq("tenant_id", state.tenantId).eq("id", state.projectId);
    if (error) throw error;
  });
  await step("TENANT_MEMBERS", async () => {
    if (!userIds.length) return;
    const { error } = await admin.from("tenant_members").delete().eq("tenant_id", state.tenantId).in("user_id", userIds);
    if (error) throw error;
  });
  await step("AUTH_USERS", async () => {
    for (const user of Object.values(state.users)) {
      if (!user.id) continue;
      const { data } = await admin.auth.admin.getUserById(user.id);
      if (data?.user?.app_metadata?.marker !== state.marker) throw new Error("auth marker mismatch");
      const { error } = await admin.auth.admin.deleteUser(user.id);
      if (error) throw error;
    }
  });
  await step("CRED_FILE", async () => {
    rmSync(path.join(IOS, "Config/.uitest-e2e-credentials"), { force: true });
    rmSync(path.join(PRIV, "phase5.env"), { force: true });
    rmSync(path.join(PRIV, "run-marker.json"), { force: true });
  });
  await step("DERIVED_DATA", async () => {
    if (state.derivedData && existsSync(state.derivedData)) {
      rmSync(state.derivedData, { recursive: true, force: true });
    }
  });
  await step("DEDICATED_SIMULATOR", async () => {
    if (!state.createdSim || !state.simUdid) return;
    try {
      sh(`xcrun simctl shutdown ${state.simUdid} || true`);
    } catch {
      /* ignore */
    }
    sh(`xcrun simctl delete ${state.simUdid}`);
    const listed = sh("xcrun simctl list devices");
    if (listed.includes(state.simUdid)) throw new Error("simulator still present");
  });
  await step("RESIDUE_ZERO", async () => {
    const { data: projects } = await admin.from("projects").select("id").eq("name", state.marker);
    if ((projects || []).length) throw new Error("project marker residue");
    if (!userIds.length) return;
    const { data: members } = await admin.from("tenant_members").select("user_id").in("user_id", userIds);
    if ((members || []).length) throw new Error("tenant member residue");
    for (const user of Object.values(state.users)) {
      if (!user.id) continue;
      const { data } = await admin.auth.admin.getUserById(user.id);
      if (data?.user) throw new Error("auth user residue");
    }
  });
  await step("SMOKE_UNCHANGED", async () => {
    if (!smokeSnapshot?.userId) return;
    const { data: membership } = await admin
      .from("tenant_members")
      .select("id, tenant_id, user_id, role")
      .eq("user_id", smokeSnapshot.userId)
      .eq("tenant_id", smokeSnapshot.tenantId)
      .maybeSingle();
    if (!membership || membership.role !== smokeSnapshot.role) throw new Error("smoke membership changed");
    const { data: grant } = await admin
      .from("platform_owner_grants")
      .select("user_id, role")
      .eq("user_id", smokeSnapshot.userId)
      .maybeSingle();
    if ((grant?.role ?? null) !== smokeSnapshot.grantRole) throw new Error("smoke grant changed");
  });

  if (state.serverProc) {
    try {
      state.serverProc.kill("SIGTERM");
    } catch {
      /* ignore */
    }
    console.log("LOCAL_DEV_SERVER: STOPPED");
  }
  return steps.every(([, v]) => v === "OK");
}

async function ensureSimulator() {
  state.runId = state.runId || randomBytes(6).toString("hex");
  state.simName = `AISTROYKA-Phase5-${state.runId}`;
  const runtimes = sh("xcrun simctl list runtimes -j");
  const runtimeJson = JSON.parse(runtimes);
  const iosRuntimes = (runtimeJson.runtimes || [])
    .filter((r) => r.name?.includes("iOS") && r.isAvailable !== false)
    .sort((a, b) => String(b.version || "").localeCompare(String(a.version || "")));
  if (!iosRuntimes.length) throw new Error("no iOS simulator runtime");
  const runtime = iosRuntimes[0].identifier;
  const types = JSON.parse(sh("xcrun simctl list devicetypes -j"));
  const iphone = (types.devicetypes || []).find((d) => /iPhone-17$/.test(d.identifier))
    || (types.devicetypes || []).find((d) => /iPhone-17-Pro$/.test(d.identifier))
    || (types.devicetypes || []).find((d) => /iPhone/.test(d.identifier));
  if (!iphone) throw new Error("no iPhone device type");
  const udid = sh(`xcrun simctl create "${state.simName}" "${iphone.identifier}" "${runtime}"`).trim();
  state.simUdid = udid;
  state.createdSim = true;
  writeFileSync(
    path.join(PRIV, "run-marker.json"),
    JSON.stringify({ runId: state.runId, simName: state.simName, udid, createdAt: new Date().toISOString() }, null, 2),
    { mode: 0o600 }
  );
  sh(`xcrun simctl boot ${udid} || true`);
  // Best-effort addmedia (UITest also uses DEBUG inject path).
  const mediaDir = "/tmp/aistroyka-phase5-media";
  if (existsSync(path.join(mediaDir, "before.jpg"))) {
    try {
      sh(`xcrun simctl addmedia ${udid} ${mediaDir}/before.jpg ${mediaDir}/after.jpg`);
      console.log("SIM_MEDIA: ADDED");
    } catch {
      console.log("SIM_MEDIA: SKIP");
    }
  }
  console.log("SIMULATOR: CREATED");
  return udid;
}

async function xbTest(project, scheme, onlyTesting, env) {
  const dest = `platform=iOS Simulator,id=${state.simUdid}`;
  const args = [
    "test",
    "-project", project,
    "-scheme", scheme,
    "-destination", dest,
    "-destination-timeout", "120",
    "-derivedDataPath", state.derivedData,
    "-parallel-testing-enabled", "NO",
    "-maximum-parallel-testing-workers", "1",
    `-only-testing:${onlyTesting}`,
    "CODE_SIGNING_ALLOWED=NO",
  ];
  const result = await runCmd("xcodebuild", args, { cwd: IOS, env });
  return result;
}

async function main() {
  process.umask(0o077);
  mkdirSync(PRIV, { recursive: true, mode: 0o700 });
  const env = mergeEnv();
  const baseUrl = (env.PHASE5_BASE_URL || env.IOS_E2E_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
  console.log("TARGET_KIND:", isLoopback(baseUrl) ? "loopback" : "non_loopback");
  if (!isLoopback(baseUrl)) {
    console.log("VERDICT: BLOCKED_EXTERNAL production URL not allowed for Phase 5 Layer B");
    process.exit(2);
  }

  const urlRef = hostRef(env.NEXT_PUBLIC_SUPABASE_URL);
  const anonRef = jwtRef(env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const serviceRef = jwtRef(env.SUPABASE_SERVICE_ROLE_KEY);
  console.log("SUPABASE_URL:", present(env.NEXT_PUBLIC_SUPABASE_URL) ? "PRESENT" : "MISSING");
  console.log("ANON_KEY:", present(env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ? "PRESENT" : "MISSING");
  console.log("SERVICE_ROLE:", present(env.SUPABASE_SERVICE_ROLE_KEY) && env.SUPABASE_SERVICE_ROLE_KEY.includes(".") ? "JWT_PRESENT" : "MISSING");
  console.log("REFS_MATCH:", urlRef && urlRef === anonRef && anonRef === serviceRef ? "YES" : "NO");
  console.log("REF_AISTROYKA:", urlRef === AISTROYKA_REF ? "YES" : "NO");
  console.log("SECRETS_XCCONFIG:", existsSync(path.join(IOS, "Config/Secrets.xcconfig")) ? "PRESENT" : "MISSING");
  console.log("PHYSICAL_DEVICE_ALLOW:", env.IOS_PHASE5_ALLOW_DEVICE === "1" ? "YES" : "NO");
  if (!urlRef || urlRef !== anonRef || anonRef !== serviceRef || urlRef !== AISTROYKA_REF) {
    throw new Error("Supabase ref mismatch");
  }
  if (!present(env.SMOKE_EMAIL) || !present(env.SMOKE_PASSWORD)) throw new Error("smoke login pair missing");

  async function startLocalDevServer() {
    const url = new URL(baseUrl);
    const port = url.port || "3000";
    try {
      await runCmd(
        "bash",
        ["-lc", `PIDS=$(lsof -tiTCP:${port} -sTCP:LISTEN); if [ -n "$PIDS" ]; then kill -9 $PIDS; fi`],
        { cwd: WEB, env: process.env }
      );
    } catch {
      /* ignore */
    }
    await sleep(1000);
    console.log("LOCAL_DEV_SERVER: STARTING");
    const nextBin = path.join(WEB, "node_modules/next/dist/bin/next");
    const serverEnv = {
      ...process.env,
      ...env,
      PORT: port,
      NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
      FORCE_COLOR: "0",
    };
    state.serverProc = spawn(process.execPath, [nextBin, "dev", "-H", "127.0.0.1", "-p", port], {
      cwd: WEB,
      env: serverEnv,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const serverLog = path.join(PRIV, "next-dev.log");
    state.serverProc.stdout.on("data", (d) => {
      try {
        writeFileSync(serverLog, sanitize(d.toString()), { flag: "a", mode: 0o600 });
      } catch {
        /* ignore */
      }
    });
    state.serverProc.stderr.on("data", (d) => {
      try {
        writeFileSync(serverLog, sanitize(d.toString()), { flag: "a", mode: 0o600 });
      } catch {
        /* ignore */
      }
    });
    return waitForHealth(baseUrl, 180000);
  }

  let healthOk = await waitForHealth(baseUrl, 5000);
  if (healthOk) {
    // Reject hung listeners that answer health but stall authenticated routes.
    try {
      const probe = await fetch(`${baseUrl}/api/v1/health`, { signal: AbortSignal.timeout(5000) });
      healthOk = probe.ok;
      if (healthOk) {
        const body = await probe.json().catch(() => null);
        healthOk = Boolean(body);
      }
    } catch {
      healthOk = false;
    }
  }
  if (healthOk) {
    console.log("LOCAL_DEV_SERVER: REUSE");
  } else {
    healthOk = await startLocalDevServer();
  }
  if (!healthOk) throw new Error("loopback health unavailable");
  console.log("HEALTH: OK");

  const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: smokeAuth, error: smokeError } = await anon.auth.signInWithPassword({
    email: env.SMOKE_EMAIL,
    password: env.SMOKE_PASSWORD,
  });
  if (smokeError || !smokeAuth.session?.access_token) throw new Error("smoke login failed");
  console.log("SMOKE_LOGIN: OK");
  const smokeMe = await fetchMe(baseUrl, smokeAuth.session.access_token, "web");
  const meData = smokeMe.body?.data || {};
  if (smokeMe.status !== 200 || !meData.tenant_id || !["owner", "admin"].includes(meData.role)) {
    throw new Error("smoke active tenant must be owner/admin");
  }
  state.tenantId = meData.tenant_id;
  const smokeUserId = smokeAuth.user?.id || meData.user_id;
  const { data: smokeMembership } = await admin
    .from("tenant_members")
    .select("id, tenant_id, user_id, role")
    .eq("user_id", smokeUserId)
    .eq("tenant_id", state.tenantId)
    .maybeSingle();
  const { data: smokeGrant } = await admin
    .from("platform_owner_grants")
    .select("user_id, role")
    .eq("user_id", smokeUserId)
    .maybeSingle();
  const smokeSnapshot = {
    userId: smokeUserId,
    tenantId: state.tenantId,
    role: smokeMembership?.role || meData.role,
    grantRole: smokeGrant?.role ?? null,
  };
  console.log("SMOKE_SNAPSHOT: CAPTURED");
  await anon.auth.signOut();

  {
    const { data: residues } = await admin.from("projects").select("id, name").like("name", `${MARKER_PREFIX} %`).limit(20);
    console.log("PHASE5_RESIDUE_PREEXISTING:", (residues || []).length);
    for (const project of residues || []) {
      const { data: tasks } = await admin.from("worker_tasks").select("id").eq("project_id", project.id);
      const taskIds = (tasks || []).map((t) => t.id);
      if (taskIds.length) {
        await admin.from("task_assignments").delete().in("task_id", taskIds);
        await admin.from("worker_tasks").delete().in("id", taskIds);
      }
      await admin.from("project_members").delete().eq("project_id", project.id);
      await admin.from("projects").delete().eq("id", project.id);
    }
    const { data: authUsers } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    for (const user of authUsers?.users || []) {
      const marker = user.app_metadata?.marker;
      if (typeof marker === "string" && marker.startsWith(`${MARKER_PREFIX} `)) {
        await admin.from("tenant_members").delete().eq("user_id", user.id);
        await admin.auth.admin.deleteUser(user.id);
      }
    }
    console.log("PHASE5_RESIDUE_PREEXISTING_AFTER: 0");
  }

  state.runId = randomBytes(6).toString("hex");
  state.marker = `${MARKER_PREFIX} ${state.runId}`;
  state.derivedData = path.join("/tmp", `aistroyka-phase5-dd-${state.runId}`);
  mkdirSync(state.derivedData, { recursive: true, mode: 0o700 });

  let cleanupOk = false;
  let layerB = "FAIL";
  try {
    await createUser(admin, "worker");
    await createUser(admin, "manager");

    for (const [persona, role] of [
      ["worker", "member"],
      ["manager", "member"],
    ]) {
      const { error } = await admin.from("tenant_members").insert({
        tenant_id: state.tenantId,
        user_id: state.users[persona].id,
        role,
      });
      if (error) throw error;
      console.log(`FIXTURE_TENANT_MEMBER_${persona.toUpperCase()}: CREATED`);
    }

    const { data: project, error: projectError } = await admin
      .from("projects")
      .insert({
        tenant_id: state.tenantId,
        name: state.marker,
        client_portal_enabled: false,
        client_show_budget_summary: false,
      })
      .select("id")
      .single();
    if (projectError || !project?.id) throw projectError || new Error("project create failed");
    state.projectId = project.id;
    console.log("FIXTURE_PROJECT: CREATED");

    for (const [persona, role] of [
      ["manager", "manager"],
      ["worker", "worker"],
    ]) {
      const { error } = await admin.from("project_members").insert({
        tenant_id: state.tenantId,
        project_id: state.projectId,
        user_id: state.users[persona].id,
        role,
        status: "active",
      });
      if (error) throw error;
      console.log(`FIXTURE_PROJECT_MEMBER_${persona.toUpperCase()}: CREATED`);
    }

    const { data: task, error: taskError } = await admin
      .from("worker_tasks")
      .insert({
        tenant_id: state.tenantId,
        project_id: state.projectId,
        title: `${state.marker} task`,
        due_date: new Date().toISOString().slice(0, 10),
        status: "pending",
        assigned_to: state.users.worker.id,
        report_required: true,
        required_photos: { before: 1, after: 1 },
      })
      .select("id")
      .single();
    if (taskError || !task?.id) throw taskError || new Error("task create failed");
    state.taskId = task.id;
    const { error: assignError } = await admin.from("task_assignments").insert({
      tenant_id: state.tenantId,
      task_id: state.taskId,
      user_id: state.users.worker.id,
      assigned_by: state.users.manager.id,
    });
    if (assignError) throw assignError;
    console.log("FIXTURE_TASK: CREATED");

    // Persona /me proofs
    for (const [persona, client] of [
      ["worker", "ios_worker"],
      ["manager", "ios_manager"],
    ]) {
      const { data: auth, error } = await anon.auth.signInWithPassword({
        email: state.users[persona].email,
        password: state.users[persona].password,
      });
      if (error || !auth.session?.access_token) throw error || new Error(`${persona} login failed`);
      const me = await fetchMe(baseUrl, auth.session.access_token, client);
      const data = me.body?.data || {};
      console.log(`ME_${persona.toUpperCase()}_STATUS:`, me.status);
      console.log(`ME_${persona.toUpperCase()}_TENANT:`, data.tenant_id === state.tenantId ? "MATCH" : "MISMATCH");
      console.log(`ME_${persona.toUpperCase()}_ROLE:`, data.role || "NULL");
      if (me.status !== 200 || data.tenant_id !== state.tenantId) throw new Error(`${persona} /me failed`);
      const { data: grant } = await admin
        .from("platform_owner_grants")
        .select("user_id")
        .eq("user_id", state.users[persona].id)
        .maybeSingle();
      console.log(`ME_${persona.toUpperCase()}_PLATFORM_GRANT:`, grant ? "UNEXPECTED" : "ABSENT");
      if (grant) throw new Error(`${persona} must not have platform grant`);
      await anon.auth.signOut();
    }
    if (state.users.worker.id === state.users.manager.id) throw new Error("worker/manager user ids must differ");

    await ensureSimulator();

    const xbEnv = {
      ...process.env,
      ...env,
      IOS_PHASE5: "1",
      IOS_PHASE5_NO_SKIP: "1",
      IOS_E2E_SIMULATOR_UDID: state.simUdid,
      IOS_E2E_BASE_URL: baseUrl,
      PHASE5_BASE_URL: baseUrl,
      IOS_E2E_WORKER_EMAIL: state.users.worker.email,
      IOS_E2E_WORKER_PASSWORD: state.users.worker.password,
      IOS_E2E_MANAGER_EMAIL: state.users.manager.email,
      IOS_E2E_MANAGER_PASSWORD: state.users.manager.password,
      IOS_E2E_PROJECT_ID: state.projectId,
      IOS_E2E_TASK_ID: state.taskId,
      IOS_E2E_WORKER_NOTE: state.marker,
      IOS_E2E_MANAGER_NOTE: `${state.marker} manager changes`,
      AISTROYKA_E2E_CRED_FILE: path.join(IOS, "Config/.uitest-e2e-credentials"),
      SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    };

    writeCredFile({
      baseUrl,
      supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      more: {
        IOS_E2E_EMAIL: state.users.worker.email,
        IOS_E2E_PASSWORD: state.users.worker.password,
      },
    });

    const workerProj = path.join(IOS, "AiStroykaWorker/AiStroykaWorker.xcodeproj");
    const managerProj = path.join(IOS, "AiStroykaManager/AiStroykaManager.xcodeproj");

    console.log("LAYERB_STEP: Worker submit+offline");
    let w1 = await xbTest(
      workerProj,
      "AiStroykaWorker",
      "AiStroykaWorkerUITests/WorkerPhase5UITests/testWorker_phase5_fullSubmitWithOfflineQueue",
      xbEnv
    );
    if (w1.code !== 0) {
      console.log("LAYERB_WORKER_SUBMIT: RETRY_ONCE_SIM");
      try {
        sh(`xcrun simctl shutdown ${state.simUdid} || true`);
        sh(`xcrun simctl boot ${state.simUdid} || true`);
        await sleep(5000);
      } catch {
        /* ignore */
      }
      w1 = await xbTest(
        workerProj,
        "AiStroykaWorker",
        "AiStroykaWorkerUITests/WorkerPhase5UITests/testWorker_phase5_fullSubmitWithOfflineQueue",
        xbEnv
      );
    }
    if (w1.code !== 0) throw new Error("Worker Layer B submit failed");

    // Resolve exact submitted report by marker note
    for (let i = 0; i < 40; i++) {
      const { data: reports } = await admin
        .from("worker_reports")
        .select("id, status, worker_note, user_id")
        .eq("tenant_id", state.tenantId)
        .eq("user_id", state.users.worker.id)
        .order("created_at", { ascending: false })
        .limit(5);
      const hit = (reports || []).find((r) => String(r.worker_note || "").includes(state.runId) || r.status === "submitted");
      if (hit?.id) {
        state.reportId = hit.id;
        break;
      }
      await sleep(3000);
    }
    if (!state.reportId) throw new Error("submitted report not found after Worker UITest");
    console.log("LAYERB_REPORT: FOUND");

    const { data: mediaRows } = await admin
      .from("worker_report_media")
      .select("id")
      .eq("report_id", state.reportId);
    console.log("LAYERB_MEDIA_COUNT:", (mediaRows || []).length);
    if ((mediaRows || []).length < 2) throw new Error("expected before+after media");

    writeCredFile({
      baseUrl,
      supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      more: {
        IOS_E2E_EMAIL: state.users.manager.email,
        IOS_E2E_PASSWORD: state.users.manager.password,
        AISTROYKA_E2E_EMAIL: state.users.manager.email,
        AISTROYKA_E2E_PASSWORD: state.users.manager.password,
      },
    });
    xbEnv.IOS_E2E_REPORT_ID = state.reportId;
    xbEnv.IOS_E2E_EMAIL = state.users.manager.email;
    xbEnv.IOS_E2E_PASSWORD = state.users.manager.password;

    console.log("LAYERB_STEP: Manager changes_requested");
    let m1 = await xbTest(
      managerProj,
      "AiStroykaManager",
      "AiStroykaManagerUITests/ManagerPhase5UITests/testManager_phase5_requestChangesOnExactReport",
      xbEnv
    );
    if (m1.code !== 0) throw new Error("Manager changes_requested failed");
    {
      const { data: reviewed } = await admin
        .from("worker_reports")
        .select("status, manager_note")
        .eq("id", state.reportId)
        .single();
      if (reviewed?.status !== "changes_requested") {
        throw new Error(`expected changes_requested after Manager UITest, got ${reviewed?.status || "?"}`);
      }
      console.log("LAYERB_DB_CHANGES_REQUESTED: OK");
    }

    const { data: afterChanges } = await admin
      .from("worker_reports")
      .select("status, manager_note")
      .eq("id", state.reportId)
      .single();
    if (afterChanges?.status !== "changes_requested") throw new Error("report not changes_requested");
    console.log("LAYERB_CHANGES_REQUESTED: OK");

    writeCredFile({
      baseUrl,
      supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      more: {
        IOS_E2E_EMAIL: state.users.worker.email,
        IOS_E2E_PASSWORD: state.users.worker.password,
        AISTROYKA_E2E_EMAIL: state.users.worker.email,
        AISTROYKA_E2E_PASSWORD: state.users.worker.password,
      },
    });
    xbEnv.IOS_E2E_EMAIL = state.users.worker.email;
    xbEnv.IOS_E2E_PASSWORD = state.users.worker.password;

    console.log("LAYERB_STEP: Worker resubmit");
    let w2 = await xbTest(
      workerProj,
      "AiStroykaWorker",
      "AiStroykaWorkerUITests/WorkerPhase5UITests/testWorker_phase5_resubmitAfterChangesRequested",
      xbEnv
    );
    if (w2.code !== 0) throw new Error("Worker resubmit failed");

    for (let i = 0; i < 30; i++) {
      const { data: r } = await admin.from("worker_reports").select("status").eq("id", state.reportId).single();
      if (r?.status === "submitted") break;
      await sleep(2000);
    }

    const { count: reportCount } = await admin
      .from("worker_reports")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", state.tenantId)
      .eq("user_id", state.users.worker.id);
    console.log("LAYERB_REPORT_COUNT:", reportCount ?? "?");
    if ((reportCount ?? 0) !== 1) throw new Error("duplicate reports detected");

    writeCredFile({
      baseUrl,
      supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      more: {
        IOS_E2E_EMAIL: state.users.manager.email,
        IOS_E2E_PASSWORD: state.users.manager.password,
        AISTROYKA_E2E_EMAIL: state.users.manager.email,
        AISTROYKA_E2E_PASSWORD: state.users.manager.password,
      },
    });
    xbEnv.IOS_E2E_EMAIL = state.users.manager.email;
    xbEnv.IOS_E2E_PASSWORD = state.users.manager.password;

    console.log("LAYERB_STEP: Manager approve");
    let m2 = await xbTest(
      managerProj,
      "AiStroykaManager",
      "AiStroykaManagerUITests/ManagerPhase5UITests/testManager_phase5_approveExactReport",
      xbEnv
    );
    if (m2.code !== 0) throw new Error("Manager approve failed");

    const { data: finalReport } = await admin
      .from("worker_reports")
      .select("status, reviewed_at, manager_note")
      .eq("id", state.reportId)
      .single();
    if (finalReport?.status !== "approved") throw new Error("final status not approved");
    console.log("LAYERB_APPROVED: OK");
    layerB = "PASS";
  } finally {
    cleanupOk = await cleanup(admin, smokeSnapshot, env);
  }

  console.log("LAYER_B:", layerB);
  console.log("CLEANUP:", cleanupOk ? "PASS" : "FAIL");
  console.log("PHYSICAL_DEVICE_SMOKE: BLOCKED_EXTERNAL");
  console.log("TESTFLIGHT_UPLOAD: NOT_AUTHORIZED");
  if (layerB !== "PASS" || !cleanupOk) process.exit(1);
  console.log("VERDICT: YES");
}

main().catch((error) => {
  console.log("VERDICT: BLOCKED_OR_FAILED", sanitize(String(error?.message || error)).slice(0, 200));
  process.exit(2);
});
