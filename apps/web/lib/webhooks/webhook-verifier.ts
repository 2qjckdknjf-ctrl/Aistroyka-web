/**
 * Webhook signature verification and payload validation.
 * Direction: HMAC (e.g. X-Signature: sha256=hex(body)) or provider-specific.
 */

import type { IncomingWebhookPayload, WebhookVerificationResult } from "./webhook.types";

export interface WebhookVerifierOptions {
  /** Secret for HMAC; if not set, verification is skipped (scaffold). */
  secret?: string | null;
  /** Header name for signature (e.g. x-webhook-signature). */
  signatureHeader?: string;
  /** Max body size in bytes. */
  maxBodySize?: number;
}

const DEFAULT_MAX_BODY = 1024 * 256; // 256KB

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256(secret: string, body: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  return toHex(sig);
}

/**
 * Verify incoming webhook: signature (if secret set) and basic payload validation.
 * Replay protection: caller should check idempotency_key in payload against a store.
 */
export async function verifyIncomingWebhook(
  request: Request,
  bodyText: string,
  options: WebhookVerifierOptions = {}
): Promise<WebhookVerificationResult> {
  const { secret, signatureHeader = "x-webhook-signature", maxBodySize = DEFAULT_MAX_BODY } = options;

  if (bodyText.length > maxBodySize) {
    return { valid: false, error: "payload_too_large" };
  }

  let payload: IncomingWebhookPayload;
  try {
    payload = JSON.parse(bodyText) as IncomingWebhookPayload;
  } catch {
    return { valid: false, error: "invalid_json" };
  }

  if (secret) {
    const signature = request.headers.get(signatureHeader);
    if (!signature?.trim()) {
      return { valid: false, error: "missing_signature" };
    }
    const expected = await hmacSha256(secret, bodyText);
    const received = signature.replace(/^sha256=/i, "").trim();
    if (received !== expected) {
      return { valid: false, error: "invalid_signature" };
    }
  }
  // No secret: accept (scaffold); in production require secret

  return { valid: true, payload };
}

/** Replay protection: check if idempotency_key was already processed. Caller provides store. */
export interface ReplayCheckResult {
  isReplay: boolean;
  key?: string;
}

export function getReplayKey(payload: IncomingWebhookPayload): string | null {
  const key = payload.idempotency_key ?? payload.id;
  return typeof key === "string" ? key : null;
}
