/**
 * APNs push provider (HTTP/2 API with JWT). Env-gated.
 * Env: APNS_TEAM_ID, APNS_KEY_ID, APNS_PRIVATE_KEY (PEM), APNS_BUNDLE_ID, APNS_ENV=production|sandbox
 */

import type { PushProvider, PushSendParams, PushSendResult } from "./push.provider.types";

const APNS_HOST_PROD = "https://api.push.apple.com";
const APNS_HOST_SANDBOX = "https://api.sandbox.push.apple.com";

function getApnsHost(): string {
  return process.env.APNS_ENV === "production" ? APNS_HOST_PROD : APNS_HOST_SANDBOX;
}

function getPrivateKey(): string | null {
  return process.env.APNS_PRIVATE_KEY?.trim() || process.env.APNS_KEY?.trim() || null;
}

function isConfigured(): boolean {
  return Boolean(
    process.env.APNS_TEAM_ID?.trim() &&
      process.env.APNS_KEY_ID?.trim() &&
      getPrivateKey() &&
      process.env.APNS_BUNDLE_ID?.trim()
  );
}

/** Build JWT for APNs (ES256). Uses Node crypto. */
function signApnsJwt(): string | null {
  const teamId = process.env.APNS_TEAM_ID?.trim();
  const keyId = process.env.APNS_KEY_ID?.trim();
  const privateKeyPem = getPrivateKey();
  if (!teamId || !keyId || !privateKeyPem) return null;

  try {
    const header = { alg: "ES256", kid: keyId };
    const now = Math.floor(Date.now() / 1000);
    const payload = { iss: teamId, iat: now };
    const headerB64 = base64UrlEncode(JSON.stringify(header));
    const payloadB64 = base64UrlEncode(JSON.stringify(payload));
    const message = `${headerB64}.${payloadB64}`;

    const crypto = require("crypto");
    const key = crypto.createPrivateKey({
      key: privateKeyPem,
      format: "pem",
    });
    const sign = crypto.createSign("sha256");
    sign.update(message);
    const derSig = sign.sign(key);
    const rawSig = derToRawEcdsa(derSig);
    if (!rawSig) return null;
    const sigB64 = base64UrlEncode(rawSig.toString("binary"));
    return `${message}.${sigB64}`;
  } catch {
    return null;
  }
}

function base64UrlEncode(str: string): string {
  const buf = Buffer.from(str, "utf8");
  return buf.toString("base64url");
}

/** Convert DER ECDSA signature to raw r||s (64 bytes for P-256). */
function derToRawEcdsa(der: Buffer): Buffer | null {
  try {
    if (der[0] !== 0x30) return null;
    let i = 2;
    if (der[1] & 0x80) i += der[1] & 0x7f;
    if (der[i++] !== 0x02) return null;
    const rLen = der[i++];
    let r = der.subarray(i, i + rLen);
    i += rLen;
    if (rLen === 33 && r[0] === 0) r = r.subarray(1);
    if (der[i++] !== 0x02) return null;
    const sLen = der[i++];
    let s = der.subarray(i, i + sLen);
    if (sLen === 33 && s[0] === 0) s = s.subarray(1);
    const pad = (b: Buffer) => (b.length >= 32 ? b : Buffer.concat([Buffer.alloc(32 - b.length), b]));
    return Buffer.concat([pad(r), pad(s)]);
  } catch {
    return null;
  }
}

async function sendApnsHttp(params: PushSendParams, jwt: string): Promise<PushSendResult> {
  const host = getApnsHost();
  const url = `${host}/3/device/${encodeURIComponent(params.token)}`;
  const body: Record<string, unknown> = {
    aps: {
      alert: params.title || params.body ? { title: params.title, body: params.body } : undefined,
      sound: "default",
    },
    ...(params.data ?? {}),
  };
  const headers: Record<string, string> = {
    authorization: `bearer ${jwt}`,
    "apns-topic": process.env.APNS_BUNDLE_ID!,
    "apns-push-type": "alert",
    "content-type": "application/json",
  };
  if (params.collapseKey) headers["apns-collapse-id"] = params.collapseKey;
  if (params.ttlSec != null) headers["apns-expiration"] = String(params.ttlSec);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (res.status === 200) return { ok: true };
    const text = await res.text();
    if (res.status === 400 || res.status === 410) return { ok: false, code: "invalid_token", message: text };
    if (res.status === 403) return { ok: false, code: "auth_error", message: text };
    return { ok: false, code: "retryable", message: text || String(res.status) };
  } catch (e) {
    return { ok: false, code: "retryable", message: e instanceof Error ? e.message : String(e) };
  }
}

const apnsProvider: PushProvider = {
  async send(params: PushSendParams): Promise<PushSendResult> {
    if (params.platform !== "ios") return { ok: false, code: "retryable", message: "APNS is iOS only" };
    if (!isConfigured()) return { ok: false, code: "retryable", message: "APNS not configured" };
    const jwt = signApnsJwt();
    if (!jwt) return { ok: false, code: "auth_error", message: "Failed to sign JWT" };
    return sendApnsHttp(params, jwt);
  },
};

export function isApnsConfigured(): boolean {
  return isConfigured();
}

export function getApnsProvider(): PushProvider | null {
  return isConfigured() ? apnsProvider : null;
}
