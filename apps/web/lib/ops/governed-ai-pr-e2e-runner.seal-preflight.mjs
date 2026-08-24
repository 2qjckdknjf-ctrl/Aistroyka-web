#!/usr/bin/env bun
import { GOVERNED_E2E_SEAL_PRIVATE_KEY_ENV } from "./governed-ai-pr-e2e-runner.seal-crypto.ts";

const privateKey = process.env[GOVERNED_E2E_SEAL_PRIVATE_KEY_ENV];
if (!privateKey || !privateKey.includes("BEGIN")) {
  console.error(`::error::BLOCKED_SEAL_PRIVATE_KEY_MISSING (${GOVERNED_E2E_SEAL_PRIVATE_KEY_ENV})`);
  process.exit(1);
}
console.log(`${GOVERNED_E2E_SEAL_PRIVATE_KEY_ENV}=PRESENT`);
