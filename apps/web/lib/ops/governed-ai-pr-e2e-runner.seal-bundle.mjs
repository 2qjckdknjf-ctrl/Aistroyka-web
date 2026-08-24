#!/usr/bin/env bun
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildGovernedAiE2eCacheKey,
  readGovernedAiE2eSealPublicKey,
  sealGovernedAiE2ePayload,
} from "./governed-ai-pr-e2e-runner.seal-crypto.ts";

const workspaceDir = process.argv[2];
const outputPath = process.argv[3];
const publicKeyPath = process.argv[4];

if (!workspaceDir || !outputPath || !publicKeyPath) {
  console.error(
    "usage: seal-bundle.mjs <pr-workspace-dir> <output-bundle.json> <public-key.pem>",
  );
  process.exit(1);
}

const requiredEnv = [
  "GOVERNED_E2E_SEAL_REPOSITORY",
  "GOVERNED_E2E_SEAL_WORKFLOW",
  "GOVERNED_E2E_SEAL_RUN_ID",
  "GOVERNED_E2E_SEAL_RUN_ATTEMPT",
  "GOVERNED_E2E_SEAL_DISPATCH_SHA",
  "GOVERNED_E2E_SEAL_PULL_REQUEST_NUMBER",
  "GOVERNED_E2E_SEAL_TARGET_SHA",
  "GOVERNED_E2E_SEAL_DEPLOYMENT_ID",
];

for (const name of requiredEnv) {
  if (!process.env[name]) {
    console.error(`missing required env: ${name}`);
    process.exit(1);
  }
}

const resultJson = resolve(workspaceDir, "e2e-result.json");
const resultStderr = resolve(workspaceDir, "e2e-result.stderr");
const exitCodeFile = resolve(workspaceDir, ".e2e-exit-code");

if (!existsSync(resultJson) || !existsSync(exitCodeFile)) {
  console.error("missing harness output files");
  process.exit(1);
}

const e2eExitCode = readFileSync(exitCodeFile, "utf8").trim();
if (!/^[0-9]+$/.test(e2eExitCode)) {
  console.error("invalid harness exit code");
  process.exit(1);
}

const binding = {
  repository: process.env.GOVERNED_E2E_SEAL_REPOSITORY,
  workflow: process.env.GOVERNED_E2E_SEAL_WORKFLOW,
  run_id: process.env.GOVERNED_E2E_SEAL_RUN_ID,
  run_attempt: process.env.GOVERNED_E2E_SEAL_RUN_ATTEMPT,
  dispatch_sha: process.env.GOVERNED_E2E_SEAL_DISPATCH_SHA,
  pull_request_number: process.env.GOVERNED_E2E_SEAL_PULL_REQUEST_NUMBER,
  target_sha: process.env.GOVERNED_E2E_SEAL_TARGET_SHA,
  deployment_id: process.env.GOVERNED_E2E_SEAL_DEPLOYMENT_ID,
};

const bundle = sealGovernedAiE2ePayload(
  {
    e2e_result_json: readFileSync(resultJson, "utf8"),
    e2e_result_stderr: existsSync(resultStderr) ? readFileSync(resultStderr, "utf8") : "",
    e2e_exit_code: e2eExitCode,
  },
  binding,
  readGovernedAiE2eSealPublicKey(publicKeyPath),
);

writeFileSync(outputPath, JSON.stringify(bundle), { encoding: "utf8", mode: 0o600 });
writeFileSync(
  `${outputPath}.cache-key`,
  buildGovernedAiE2eCacheKey(binding),
  { encoding: "utf8", mode: 0o600 },
);
