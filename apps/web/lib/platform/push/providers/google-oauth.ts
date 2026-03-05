/**
 * Google OAuth2 JWT flow for service accounts (e.g. FCM HTTP v1).
 * Builds JWT assertion, exchanges for access token, caches in-memory with expiry.
 */

const DEFAULT_TOKEN_URI = "https://oauth2.googleapis.com/token";
const DEFAULT_EXPIRY_SEC = 3600;
const CACHE_BUFFER_SEC = 60; // refresh before expiry

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

let cached: TokenCache | null = null;

/**
 * Normalize FCM_PRIVATE_KEY: may be stored with literal \n in env.
 */
export function normalizePrivateKey(pem: string): string {
  return pem.replace(/\\n/g, "\n").trim();
}

/**
 * Build JWT assertion for Google OAuth2 (RS256).
 * Claims: iss, sub (optional), aud, iat, exp.
 */
export function buildGoogleJwtAssertion(params: {
  clientEmail: string;
  privateKeyPem: string;
  tokenUri?: string;
  expirySec?: number;
}): string | null {
  const { clientEmail, privateKeyPem, tokenUri = DEFAULT_TOKEN_URI, expirySec = DEFAULT_EXPIRY_SEC } = params;
  const key = normalizePrivateKey(privateKeyPem);
  if (!key) return null;

  try {
    const crypto = require("crypto");
    const header = { alg: "RS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: clientEmail,
      sub: clientEmail,
      aud: tokenUri,
      iat: now,
      exp: now + expirySec,
    };
    const headerB64 = base64UrlEncode(JSON.stringify(header));
    const payloadB64 = base64UrlEncode(JSON.stringify(payload));
    const message = `${headerB64}.${payloadB64}`;

    const privateKey = crypto.createPrivateKey({
      key,
      format: "pem",
    });
    const sign = crypto.createSign("RSA-SHA256");
    sign.update(message);
    const sig = sign.sign(privateKey);
    const sigB64 = base64UrlEncode(sig.toString("binary"));
    return `${message}.${sigB64}`;
  } catch {
    return null;
  }
}

function base64UrlEncode(input: string): string {
  const buf = Buffer.from(input, "utf8");
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Exchange JWT for access token via fetch. No cache.
 */
export async function exchangeJwtForAccessToken(params: {
  assertion: string;
  tokenUri?: string;
}): Promise<{ accessToken: string; expiresIn: number } | null> {
  const { assertion, tokenUri = DEFAULT_TOKEN_URI } = params;
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });
  const res = await fetch(tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  const accessToken = data?.access_token;
  const expiresIn = typeof data?.expires_in === "number" ? data.expires_in : 3600;
  if (!accessToken) return null;
  return { accessToken, expiresIn };
}

/**
 * Get valid access token: use cache if not expired (with buffer), else exchange and cache.
 */
export async function getAccessToken(params: {
  clientEmail: string;
  privateKeyPem: string;
  tokenUri?: string;
}): Promise<string | null> {
  const nowSec = Math.floor(Date.now() / 1000);
  if (cached && cached.expiresAt > nowSec + CACHE_BUFFER_SEC) {
    return cached.accessToken;
  }
  const assertion = buildGoogleJwtAssertion({
    clientEmail: params.clientEmail,
    privateKeyPem: params.privateKeyPem,
    tokenUri: params.tokenUri,
  });
  if (!assertion) return null;
  const result = await exchangeJwtForAccessToken({
    assertion,
    tokenUri: params.tokenUri,
  });
  if (!result) return null;
  cached = {
    accessToken: result.accessToken,
    expiresAt: nowSec + result.expiresIn,
  };
  return result.accessToken;
}

/** Clear in-memory cache (for tests). */
export function clearTokenCache(): void {
  cached = null;
}
