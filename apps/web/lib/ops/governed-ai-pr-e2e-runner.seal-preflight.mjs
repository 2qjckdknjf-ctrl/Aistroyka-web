#!/usr/bin/env bun
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  GOVERNED_E2E_SEAL_PRIVATE_KEY_ENV,
  readGovernedAiE2eSealPublicKey,
  verifyGovernedAiE2eSealKeyPair,
} from "./governed-ai-pr-e2e-runner.seal-crypto.ts";

const privateKey = process.env[GOVERNED_E2E_SEAL_PRIVATE_KEY_ENV];
if (!privateKey || !privateKey.includes("BEGIN")) {
  console.error(`::error::BLOCKED_SEAL_PRIVATE_KEY_MISSING (${GOVERNED_E2E_SEAL_PRIVATE_KEY_ENV})`);
  process.exit(1);
}

const publicKeyPath =
  process.env.GOVERNED_E2E_SEAL_PUBLIC_KEY_PATH ??
  join(dirname(fileURLToPath(import.meta.url)), "governed-ai-pr-e2e-runner.seal-public-key.pem");

try {
  const publicKey = readGovernedAiE2eSealPublicKey(publicKeyPath);
  verifyGovernedAiE2eSealKeyPair(privateKey, publicKey);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`::error::BLOCKED_SEAL_KEY_PAIR_INVALID (${message})`);
  process.exit(1);
}

console.log(`${GOVERNED_E2E_SEAL_PRIVATE_KEY_ENV}=PRESENT`);
console.log("GOVERNED_E2E_SEAL_PUBLIC_KEY_MATCH=VERIFIED");
