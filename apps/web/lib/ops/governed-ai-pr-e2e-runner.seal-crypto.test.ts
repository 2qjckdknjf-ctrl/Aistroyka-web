import { describe, expect, it } from "vitest";
import { generateKeyPairSync, randomBytes } from "node:crypto";
import {
  buildGovernedAiE2eCacheKey,
  parseGovernedAiE2eSealBundle,
  sealGovernedAiE2ePayload,
  unsealGovernedAiE2eBundle,
  validateGovernedAiE2eSealManifest,
  verifyGovernedAiE2eSealKeyPair,
  type GovernedAiE2eSealBindingContext,
} from "./governed-ai-pr-e2e-runner.seal-crypto";

function binding(overrides: Partial<GovernedAiE2eSealBindingContext> = {}): GovernedAiE2eSealBindingContext {
  return {
    repository: "2qjckdknjf-ctrl/Aistroyka-web",
    workflow: ".github/workflows/governed-ai-pr-e2e-runner.yml",
    run_id: "12345",
    run_attempt: "1",
    dispatch_sha: "a".repeat(40),
    pull_request_number: "247",
    target_sha: "b".repeat(40),
    deployment_id: "6064462333",
    ...overrides,
  };
}

function keyPair() {
  return generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
}

describe("governed-ai seal cache key binding", () => {
  it("binds repository workflow run attempt dispatch target pr and deployment", () => {
    const ctx = binding();
    expect(buildGovernedAiE2eCacheKey(ctx)).toBe(
      [
        "governed-e2e-sealed-v1",
        ctx.run_id,
        ctx.run_attempt,
        ctx.dispatch_sha,
        ctx.target_sha,
        ctx.pull_request_number,
        ctx.deployment_id,
      ].join("-"),
    );
  });

  it.each([
    ["run_id", { run_id: "99999" }],
    ["run_attempt", { run_attempt: "2" }],
    ["dispatch_sha", { dispatch_sha: "c".repeat(40) }],
    ["target_sha", { target_sha: "d".repeat(40) }],
    ["pull_request_number", { pull_request_number: "999" }],
    ["deployment_id", { deployment_id: "1" }],
  ])("rejects wrong %s on restore", (field, override) => {
    const ctx = binding();
    const keys = keyPair();
    const bundle = sealGovernedAiE2ePayload(
      { e2e_result_json: "{}", e2e_result_stderr: "", e2e_exit_code: "0" },
      ctx,
      keys.publicKey,
    );
    expect(() =>
      unsealGovernedAiE2eBundle(bundle, binding(override), keys.privateKey),
    ).toThrow(/SEAL_MANIFEST_BINDING_MISMATCH/);
  });
});

describe("governed-ai seal crypto AEAD", () => {
  it("round-trips payload with RSA-OAEP + AES-256-GCM", () => {
    const keys = keyPair();
    const ctx = binding();
    const payload = {
      e2e_result_json: JSON.stringify({ verdict: "PROVEN" }),
      e2e_result_stderr: "stderr",
      e2e_exit_code: "0",
    };
    const bundle = sealGovernedAiE2ePayload(payload, ctx, keys.publicKey);
    expect(unsealGovernedAiE2eBundle(bundle, ctx, keys.privateKey)).toEqual(payload);
  });

  it("rejects wrong private key", () => {
    const keys = keyPair();
    const other = keyPair();
    const ctx = binding();
    const bundle = sealGovernedAiE2ePayload(
      { e2e_result_json: "{}", e2e_result_stderr: "", e2e_exit_code: "0" },
      ctx,
      keys.publicKey,
    );
    expect(() => unsealGovernedAiE2eBundle(bundle, ctx, other.privateKey)).toThrow();
  });

  it("rejects modified ciphertext", () => {
    const keys = keyPair();
    const ctx = binding();
    const bundle = sealGovernedAiE2ePayload(
      { e2e_result_json: "{}", e2e_result_stderr: "", e2e_exit_code: "0" },
      ctx,
      keys.publicKey,
    );
    const tampered = { ...bundle, ciphertext: Buffer.from(bundle.ciphertext, "base64").toString("base64") };
    const bytes = Buffer.from(tampered.ciphertext, "base64");
    bytes[0] ^= 0xff;
    tampered.ciphertext = bytes.toString("base64");
    expect(() => unsealGovernedAiE2eBundle(tampered, ctx, keys.privateKey)).toThrow();
  });

  it("rejects modified GCM tag", () => {
    const keys = keyPair();
    const ctx = binding();
    const bundle = sealGovernedAiE2ePayload(
      { e2e_result_json: "{}", e2e_result_stderr: "", e2e_exit_code: "0" },
      ctx,
      keys.publicKey,
    );
    const tag = Buffer.from(bundle.manifest.aes_gcm_tag, "base64");
    tag[0] ^= 0xff;
    bundle.manifest.aes_gcm_tag = tag.toString("base64");
    expect(() => unsealGovernedAiE2eBundle(bundle, ctx, keys.privateKey)).toThrow();
  });

  it("rejects truncated ciphertext", () => {
    const keys = keyPair();
    const ctx = binding();
    const bundle = sealGovernedAiE2ePayload(
      { e2e_result_json: "{}", e2e_result_stderr: "", e2e_exit_code: "0" },
      ctx,
      keys.publicKey,
    );
    const truncated = Buffer.from(bundle.ciphertext, "base64").subarray(0, 4).toString("base64");
    expect(() =>
      unsealGovernedAiE2eBundle({ ...bundle, ciphertext: truncated }, ctx, keys.privateKey),
    ).toThrow();
  });

  it("rejects tampered manifest payload hash", () => {
    const keys = keyPair();
    const ctx = binding();
    const bundle = sealGovernedAiE2ePayload(
      { e2e_result_json: "{}", e2e_result_stderr: "", e2e_exit_code: "0" },
      ctx,
      keys.publicKey,
    );
    bundle.manifest.payload_sha256 = "0".repeat(64);
    expect(() => unsealGovernedAiE2eBundle(bundle, ctx, keys.privateKey)).toThrow(/SEAL_PAYLOAD_HASH_MISMATCH/);
  });

  it("rejects replay bundle from previous run binding", () => {
    const keys = keyPair();
    const oldCtx = binding({ run_id: "1" });
    const newCtx = binding({ run_id: "2" });
    const bundle = sealGovernedAiE2ePayload(
      { e2e_result_json: "{}", e2e_result_stderr: "", e2e_exit_code: "0" },
      oldCtx,
      keys.publicKey,
    );
    expect(() => unsealGovernedAiE2eBundle(bundle, newCtx, keys.privateKey)).toThrow(
      /SEAL_MANIFEST_BINDING_MISMATCH:run_id/,
    );
  });

  it("does not embed private key material in bundle", () => {
    const keys = keyPair();
    const bundle = sealGovernedAiE2ePayload(
      { e2e_result_json: "{}", e2e_result_stderr: "", e2e_exit_code: "0" },
      binding(),
      keys.publicKey,
    );
    const serialized = JSON.stringify(bundle);
    expect(serialized).not.toContain("BEGIN PRIVATE KEY");
    expect(serialized).not.toContain(keys.privateKey);
  });

  it("uses random nonce per seal operation", () => {
    const keys = keyPair();
    const ctx = binding();
    const payload = { e2e_result_json: "{}", e2e_result_stderr: "", e2e_exit_code: "0" };
    const a = sealGovernedAiE2ePayload(payload, ctx, keys.publicKey);
    const b = sealGovernedAiE2ePayload(payload, ctx, keys.publicKey);
    expect(a.manifest.aes_gcm_iv).not.toBe(b.manifest.aes_gcm_iv);
    expect(a.ciphertext).not.toBe(b.ciphertext);
  });
});

describe("governed-ai seal bundle parsing", () => {
  it("rejects invalid bundle shape", () => {
    expect(() => parseGovernedAiE2eSealBundle("{}")).toThrow(/SEAL_BUNDLE_SHAPE_INVALID/);
  });

  it("validates manifest before decrypt", () => {
    const keys = keyPair();
    const bundle = sealGovernedAiE2ePayload(
      { e2e_result_json: "{}", e2e_result_stderr: "", e2e_exit_code: "0" },
      binding(),
      keys.publicKey,
    );
    expect(() => validateGovernedAiE2eSealManifest(bundle.manifest, binding({ deployment_id: "1" }))).toThrow(
      /SEAL_MANIFEST_BINDING_MISMATCH:deployment_id/,
    );
  });

  it("rejects invalid exit code shape after decrypt", () => {
    const keys = keyPair();
    const ctx = binding();
    const bundle = sealGovernedAiE2ePayload(
      { e2e_result_json: "{}", e2e_result_stderr: "", e2e_exit_code: "not-a-number" },
      ctx,
      keys.publicKey,
    );
    expect(() => unsealGovernedAiE2eBundle(bundle, ctx, keys.privateKey)).toThrow(/SEAL_PAYLOAD_SHAPE_INVALID/);
  });

  it("verifies matching public/private key pair and rejects mismatch", () => {
    const keys = keyPair();
    const other = keyPair();
    expect(() => verifyGovernedAiE2eSealKeyPair(keys.privateKey, keys.publicKey)).not.toThrow();
    expect(() => verifyGovernedAiE2eSealKeyPair(keys.privateKey, other.publicKey)).toThrow(/SEAL_KEY_PAIR_MISMATCH/);
  });
});
