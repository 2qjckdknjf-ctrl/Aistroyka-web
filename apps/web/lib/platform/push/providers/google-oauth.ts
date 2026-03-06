/**
 * Google OAuth2 JWT flow for service accounts (e.g. FCM HTTP v1).
 * Builds JWT assertion, exchanges for access token, caches with expiry.
 * No network in tests when fetch is mocked.
 */

import { createPrivateKey, createSign } from "crypto";

const DEFAULT_TOKEN_URI = "https://oauth2.googleapis.com/token";
const TOKEN_EXPIRY_BUFFER_SEC = 300;

let cachedToken: string | null = null;
let cachedExpiry = 0;

/** Normalize PEM from env: literal \n -> newline. */
export function normalizePrivateKey(pem: string): string {
  return pem.replace(/\\n/g, "\n").trim();
}

/** Build JWT assertion for Google OAuth2 (RS256). */
export function buildGoogleJwt(
  clientEmail: string,
  tokenUri: string = DEFAULT_TOKEN_URI,
  privateKeyPem: string
): string | null {
  try {
    const header = { alg: "RS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: clientEmail,
      sub: clientEmail,
      aud: tokenUri,
      iat: now,
      exp: now + 3600,
    };
    const headerB64 = base64UrlEncode(JSON.stringify(header));
    const payloadB64 = base64UrlEncode(JSON.stringify(payload));
    const message = `${headerB64}.${payloadB64}`;

    const pem = normalizePrivateKey(privateKeyPem);
    const keyObj = createPrivateKey({ key: pem, format: "pem" });
    const sig = createSign("RSA-SHA256").update(message).sign(keyObj);
    const sigB64 = sig.toString("base64url");
    return `${message}.${sigB64}`;
  } catch {
    return null;
  }
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str, "utf8").toString("base64url");
}

/** Exchange JWT for access token. */
export async function exchangeJwtForToken(
  jwt: string,
  tokenUri: string = DEFAULT_TOKEN_URI
): Promise<{ access_token: string; expires_in: number } | null> {
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: jwt,
  });
  const res = await fetch(tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) return null;
  return {
    access_token: data.access_token,
    expires_in: typeof data.expires_in === "number" ? data.expires_in : 3600,
  };
}

/** Get access token (cached). Uses env FCM_CLIENT_EMAIL, FCM_PRIVATE_KEY, FCM_TOKEN_URI. */
export async function getGoogleAccessToken(): Promise<string | null> {
  const clientEmail = process.env.FCM_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FCM_PRIVATE_KEY?.trim();
  const tokenUri = (process.env.FCM_TOKEN_URI?.trim() || DEFAULT_TOKEN_URI).trim();
  if (!clientEmail || !privateKey) return null;

  const nowSec = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedExpiry > nowSec + TOKEN_EXPIRY_BUFFER_SEC) return cachedToken;

  const jwt = buildGoogleJwt(clientEmail, tokenUri, privateKey);
  if (!jwt) return null;
  const result = await exchangeJwtForToken(jwt, tokenUri);
  if (!result) return null;
  cachedToken = result.access_token;
  cachedExpiry = nowSec + result.expires_in;
  return cachedToken;
}

/** Reset cache (for tests). */
export function clearGoogleTokenCache(): void {
  cachedToken = null;
  cachedExpiry = 0;
}
