#!/usr/bin/env bun
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  parseGovernedAiE2eSealBundle,
  unsealGovernedAiE2eBundle,
  validateGovernedAiE2eSealManifest,
  GOVERNED_E2E_SEAL_PRIVATE_KEY_ENV,
} from "./governed-ai-pr-e2e-runner.seal-crypto.ts";

const bundlePath = process.argv[2];
const outputDir = process.argv[3];

if (!bundlePath || !outputDir) {
  console.error("usage: unseal-bundle.mjs <sealed-bundle.json> <output-dir>");
  process.exit(1);
}

const privateKeyPem = process.env[GOVERNED_E2E_SEAL_PRIVATE_KEY_ENV];
if (!privateKeyPem || !privateKeyPem.includes("BEGIN")) {
  console.error(`missing or invalid ${GOVERNED_E2E_SEAL_PRIVATE_KEY_ENV}`);
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

if (!existsSync(bundlePath)) {
  console.error("missing sealed bundle");
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

const bundle = parseGovernedAiE2eSealBundle(readFileSync(bundlePath, "utf8"));
validateGovernedAiE2eSealManifest(bundle.manifest, binding);
const payload = unsealGovernedAiE2eBundle(bundle, binding, privateKeyPem);

mkdirSync(outputDir, { recursive: true });
writeFileSync(resolve(outputDir, "e2e-result.json"), payload.e2e_result_json, { mode: 0o600 });
writeFileSync(resolve(outputDir, "e2e-result.stderr"), payload.e2e_result_stderr, { mode: 0o600 });
writeFileSync(resolve(outputDir, ".e2e-exit-code"), payload.e2e_exit_code, { mode: 0o600 });
