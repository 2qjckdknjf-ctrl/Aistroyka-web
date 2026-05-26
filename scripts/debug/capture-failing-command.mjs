#!/usr/bin/env node

import { spawn, spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { existsSync } from "node:fs";

const ENDPOINT = "http://127.0.0.1:7858/ingest/5abf3980-6cb7-4e9e-8bfc-f4437c784173";
const SESSION_ID = "52d197";
const commandParts = process.argv.slice(2);
const RUN_ID = `cmd_${Date.now()}`;

function debugLog(hypothesisId, location, message, data) {
  // #region agent log
  return fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": SESSION_ID,
    },
    body: JSON.stringify({
      sessionId: SESSION_ID,
      runId: RUN_ID,
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

if (commandParts.length === 0) {
  console.error("Usage: node scripts/debug/capture-failing-command.mjs <command> [args...]");
  process.exit(2);
}

const command = commandParts[0];
const args = commandParts.slice(1);
const cwd = resolve(process.cwd());
const hasNextBuildCache = existsSync(resolve(cwd, "apps/web/.next"));
const hasOpenNextCache = existsSync(resolve(cwd, "apps/web/.open-next"));
const gitStatus = spawnSync("git", ["status", "--short"], {
  cwd,
  encoding: "utf8",
});
const buildProcesses = spawnSync("ps", ["-Ao", "pid,command"], {
  encoding: "utf8",
});
const possibleParallelBuilds = (buildProcesses.stdout ?? "")
  .split("\n")
  .filter((line) => /(next build|opennextjs-cloudflare|bun run cf:build)/.test(line))
  .slice(0, 10);

void debugLog("N1", "scripts/debug/capture-failing-command.mjs:42", "preflight", {
  cwd,
  command,
  args,
  nodeVersion: process.version,
  bunVersion: process.versions.bun ?? null,
  hasNextBuildCache,
  hasOpenNextCache,
});

void debugLog("N3", "scripts/debug/capture-failing-command.mjs:52", "env_presence", {
  nextPublicSupabaseUrlSet: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
  nextPublicSupabaseAnonKeySet: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  nextPublicAppUrlSet: Boolean(process.env.NEXT_PUBLIC_APP_URL),
  ciSet: Boolean(process.env.CI),
});

void debugLog("N5", "scripts/debug/capture-failing-command.mjs:66", "workspace_state", {
  gitStatusExit: gitStatus.status,
  gitDirtyCount: (gitStatus.stdout ?? "")
    .split("\n")
    .filter((line) => line.trim().length > 0).length,
  parallelBuildProcessCount: possibleParallelBuilds.length,
  parallelBuildProcesses: possibleParallelBuilds,
});

const startedAt = Date.now();
void debugLog("N2", "scripts/debug/capture-failing-command.mjs:60", "command_start", {
  command,
  args,
});

const child = spawn(command, args, {
  shell: false,
  stdio: ["inherit", "pipe", "pipe"],
  env: process.env,
});

let stdout = "";
let stderr = "";

child.stdout.on("data", (chunk) => {
  const text = String(chunk);
  stdout += text;
  process.stdout.write(text);
});

child.stderr.on("data", (chunk) => {
  const text = String(chunk);
  stderr += text;
  process.stderr.write(text);
});

child.on("error", async (error) => {
  await debugLog("N4", "scripts/debug/capture-failing-command.mjs:84", "command_spawn_error", {
    command,
    args,
    name: error.name,
    message: error.message,
  });
  process.exit(1);
});

child.on("close", async (code, signal) => {
  await debugLog("N4", "scripts/debug/capture-failing-command.mjs:92", "command_end", {
    command,
    args,
    code,
    signal,
    durationMs: Date.now() - startedAt,
    stdoutTail: stdout.slice(-1500),
    stderrTail: stderr.slice(-1500),
  });
  process.exit(code ?? 1);
});
