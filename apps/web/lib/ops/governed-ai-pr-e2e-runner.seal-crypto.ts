import { createCipheriv, createDecipheriv, createHash, privateDecrypt, publicEncrypt, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";

export const GOVERNED_AI_E2E_SEAL_BUNDLE_VERSION = 1 as const;
export const GOVERNED_AI_E2E_SEAL_PRIVATE_KEY_ENV = "GOVERNED_E2E_SEAL_PRIVATE_KEY" as const;

export interface GovernedAiE2eSealManifest {
  version: typeof GOVERNED_AI_E2E_SEAL_BUNDLE_VERSION;
  repository: string;
  workflow: string;
  run_id: string;
  run_attempt: string;
  dispatch_sha: string;
  pull_request_number: string;
  target_sha: string;
  deployment_id: string;
  payload_sha256: string;
  aes_gcm_iv: string;
  aes_gcm_tag: string;
  wrapped_key_sha256: string;
}

export interface GovernedAiE2eSealBundle {
  manifest: GovernedAiE2eSealManifest;
  wrapped_key: string;
  ciphertext: string;
}

export interface GovernedAiE2eSealBindingContext {
  repository: string;
  workflow: string;
  run_id: string;
  run_attempt: string;
  dispatch_sha: string;
  pull_request_number: string;
  target_sha: string;
  deployment_id: string;
}

export interface GovernedAiE2eSealPayload {
  e2e_result_json: string;
  e2e_result_stderr: string;
  e2e_exit_code: string;
}

const RSA_PADDING = 4; // RSA_PKCS1_OAEP_PADDING

function sha256Hex(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex");
}

export function buildGovernedAiE2eCacheKey(binding: GovernedAiE2eSealBindingContext): string {
  return [
    "governed-e2e-sealed-v1",
    binding.run_id,
    binding.run_attempt,
    binding.dispatch_sha,
    binding.target_sha,
    binding.pull_request_number,
    binding.deployment_id,
  ].join("-");
}

export function sealGovernedAiE2ePayload(
  payload: GovernedAiE2eSealPayload,
  binding: GovernedAiE2eSealBindingContext,
  publicKeyPem: string,
): GovernedAiE2eSealBundle {
  const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
  const aesKey = randomBytes(32);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", aesKey, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  const wrappedKey = publicEncrypt(
    { key: publicKeyPem, padding: RSA_PADDING, oaepHash: "sha256" },
    aesKey,
  );

  const manifest: GovernedAiE2eSealManifest = {
    version: GOVERNED_AI_E2E_SEAL_BUNDLE_VERSION,
    repository: binding.repository,
    workflow: binding.workflow,
    run_id: binding.run_id,
    run_attempt: binding.run_attempt,
    dispatch_sha: binding.dispatch_sha,
    pull_request_number: binding.pull_request_number,
    target_sha: binding.target_sha,
    deployment_id: binding.deployment_id,
    payload_sha256: sha256Hex(plaintext),
    aes_gcm_iv: iv.toString("base64"),
    aes_gcm_tag: tag.toString("base64"),
    wrapped_key_sha256: sha256Hex(wrappedKey),
  };

  return {
    manifest,
    wrapped_key: wrappedKey.toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  };
}

export function unsealGovernedAiE2eBundle(
  bundle: GovernedAiE2eSealBundle,
  binding: GovernedAiE2eSealBindingContext,
  privateKeyPem: string,
): GovernedAiE2eSealPayload {
  validateGovernedAiE2eSealManifest(bundle.manifest, binding);

  const wrappedKey = Buffer.from(bundle.wrapped_key, "base64");
  if (sha256Hex(wrappedKey) !== bundle.manifest.wrapped_key_sha256) {
    throw new Error("SEAL_WRAPPED_KEY_HASH_MISMATCH");
  }

  const aesKey = privateDecrypt(
    { key: privateKeyPem, padding: RSA_PADDING, oaepHash: "sha256" },
    wrappedKey,
  );
  const iv = Buffer.from(bundle.manifest.aes_gcm_iv, "base64");
  const tag = Buffer.from(bundle.manifest.aes_gcm_tag, "base64");
  const ciphertext = Buffer.from(bundle.ciphertext, "base64");
  const decipher = createDecipheriv("aes-256-gcm", aesKey, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

  if (sha256Hex(plaintext) !== bundle.manifest.payload_sha256) {
    throw new Error("SEAL_PAYLOAD_HASH_MISMATCH");
  }

  const payload = JSON.parse(plaintext.toString("utf8")) as GovernedAiE2eSealPayload;
  if (
    typeof payload.e2e_result_json !== "string" ||
    typeof payload.e2e_result_stderr !== "string" ||
    typeof payload.e2e_exit_code !== "string" ||
    !/^[0-9]+$/.test(payload.e2e_exit_code)
  ) {
    throw new Error("SEAL_PAYLOAD_SHAPE_INVALID");
  }

  return payload;
}

export function validateGovernedAiE2eSealManifest(
  manifest: GovernedAiE2eSealManifest,
  binding: GovernedAiE2eSealBindingContext,
): void {
  if (manifest.version !== GOVERNED_AI_E2E_SEAL_BUNDLE_VERSION) {
    throw new Error("SEAL_MANIFEST_VERSION_MISMATCH");
  }
  const fields: Array<keyof GovernedAiE2eSealBindingContext> = [
    "repository",
    "workflow",
    "run_id",
    "run_attempt",
    "dispatch_sha",
    "pull_request_number",
    "target_sha",
    "deployment_id",
  ];
  for (const field of fields) {
    if (manifest[field] !== binding[field]) {
      throw new Error(`SEAL_MANIFEST_BINDING_MISMATCH:${field}`);
    }
  }
  if (!/^[a-f0-9]{64}$/.test(manifest.payload_sha256)) {
    throw new Error("SEAL_MANIFEST_PAYLOAD_HASH_INVALID");
  }
  if (!/^[A-Za-z0-9+/]+=*$/.test(manifest.aes_gcm_iv) || !/^[A-Za-z0-9+/]+=*$/.test(manifest.aes_gcm_tag)) {
    throw new Error("SEAL_MANIFEST_GCM_FIELDS_INVALID");
  }
}

export function readGovernedAiE2eSealPublicKey(publicKeyPath: string): string {
  const pem = readFileSync(publicKeyPath, "utf8");
  if (!pem.includes("BEGIN PUBLIC KEY")) {
    throw new Error("SEAL_PUBLIC_KEY_INVALID");
  }
  return pem;
}

export function parseGovernedAiE2eSealBundle(raw: string): GovernedAiE2eSealBundle {
  const parsed = JSON.parse(raw) as GovernedAiE2eSealBundle;
  if (!parsed?.manifest || !parsed?.wrapped_key || !parsed?.ciphertext) {
    throw new Error("SEAL_BUNDLE_SHAPE_INVALID");
  }
  return parsed;
}
