#!/usr/bin/env bun
import { readFileSync, existsSync } from "node:fs";
import { validateE2eSuccessContract } from "./governed-ai-pr-e2e-runner.verdict.ts";

const exitCodeArg = process.argv[2];
const jsonPath = process.argv[3];

if (!exitCodeArg || !jsonPath) {
  console.error("usage: validate-e2e-verdict.mjs <exit_code> <e2e-result-redacted.json>");
  process.exit(1);
}

const exitCode = Number.parseInt(exitCodeArg, 10);
if (!Number.isInteger(exitCode)) {
  console.error("exit_code must be an integer");
  process.exit(1);
}

if (!existsSync(jsonPath)) {
  console.error("missing redacted E2E output");
  process.exit(1);
}

let payload: unknown;
try {
  payload = JSON.parse(readFileSync(jsonPath, "utf8"));
} catch {
  console.error("invalid redacted E2E JSON");
  process.exit(1);
}

const result = validateE2eSuccessContract(exitCode, payload);
if (!result.ok) {
  console.error(`${result.code}: ${result.message}`);
  process.exit(1);
}

process.stdout.write(result.verdict);
