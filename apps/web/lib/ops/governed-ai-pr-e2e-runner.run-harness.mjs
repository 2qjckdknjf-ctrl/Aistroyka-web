#!/usr/bin/env bun
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  GOVERNED_AI_E2E_HARNESS_ALLOWED_ENV,
  GOVERNED_AI_E2E_SAFE_SHELL_ENV,
  GOVERNED_AI_E2E_TRUSTED_PATH,
} from "./governed-ai-pr-e2e-runner.harness-env.ts";

const workspaceDir = process.argv[2];
const entrypoint = process.argv[3];

if (!workspaceDir || !entrypoint) {
  console.error("usage: run-harness.mjs <workspace-dir> <entrypoint-relative-path>");
  process.exit(1);
}

const harnessEnv = {
  ...GOVERNED_AI_E2E_SAFE_SHELL_ENV,
  PATH: GOVERNED_AI_E2E_TRUSTED_PATH,
};

for (const name of GOVERNED_AI_E2E_HARNESS_ALLOWED_ENV) {
  const value = process.env[name];
  if (value !== undefined && value !== "") {
    harnessEnv[name] = value;
  }
}

const resultJson = resolve(workspaceDir, "e2e-result.json");
const resultStderr = resolve(workspaceDir, "e2e-result.stderr");
const exitCodeFile = resolve(workspaceDir, ".e2e-exit-code");

const nodePath = process.env.GOVERNED_E2E_NODE_PATH?.trim();
if (!nodePath || !nodePath.startsWith("/")) {
  console.error("missing or invalid GOVERNED_E2E_NODE_PATH");
  process.exit(1);
}
const scriptPath = resolve(workspaceDir, entrypoint);

const child = spawnSync(
  nodePath,
  [scriptPath],
  {
    cwd: workspaceDir,
    env: harnessEnv,
    stdio: ["ignore", "pipe", "pipe"],
    shell: false,
    timeout: 0,
  },
);

writeFileSync(resultJson, child.stdout ?? Buffer.alloc(0), { mode: 0o600 });
writeFileSync(resultStderr, child.stderr ?? Buffer.alloc(0), { mode: 0o600 });
const exitCode = child.error ? 1 : child.status ?? 1;
writeFileSync(exitCodeFile, String(exitCode), { mode: 0o600 });
process.exit(0);
