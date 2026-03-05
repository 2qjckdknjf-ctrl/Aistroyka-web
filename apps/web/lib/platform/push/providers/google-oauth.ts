/**
 * Google OAuth2 JWT flow for service account (e.g. FCM HTTP v1).
 * Builds JWT assertion, exchanges for access token, caches in-memory with expiry.
 */

const DEFAULT_TOKEN_URI = "https://oauth2.googleapis.com/token";
const JWT_HEADER = { alg: "RS256", typ: "JWT" };

function base64UrlEncode(input: string | Buffer): string {
  const raw =
    typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return raw.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Normalize private key: env may contain literal \n. */
export function normalizePrivateKey(value: string): string {
  return value.replace(/\\n/g, "\n").trim();
}

/** Build JWT assertion for Google OAuth2 (RS256). */
export function buildGoogleJwtAssertion(params: {
  clientEmail: string;
  privateKeyPem: string;
  tokenUri?: string;
}): string | null {
  const { clientEmail, privateKeyPem } = params;
  const tokenUri = params.tokenUri?.trim() || DEFAULT_TOKEN_URI;
  if (!clientEmail || !privateKeyPem) return null;

  try {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: clientEmail,
      sub: clientEmail,
      aud: tokenUri,
      iat: now,
      exp: now + 3600,
    };
    const headerB64 = base64UrlEncode(JSON.stringify(JWT_HEADER));
    const payloadB64 = base64UrlEncode(JSON.stringify(payload));
    const message = `${headerB64}.${payloadB64}`;

    const crypto = require("crypto");
    const key = crypto.createPrivateKey({
      key: normalizePrivateKey(privateKeyPem),
      format: "pem",
    });
    const sign = crypto.createSign("RSA-SHA256");
    sign.update(message);
    const derSig = sign.sign(key);
    const sigB64 = base64UrlEncode(derSig);
    return `${message}.${sigB64}`;
  } catch {
    return null;
  }
}

/** In-memory cache: { token, expiresAtMs }. Best-effort. */
let cached: { token: string; expiresAtMs: number } | null = null;

/** Exchange JWT for access token. Uses fetch; caches token until ~5 min before expiry. */
export async function getGoogleAccessToken(params: {
  clientEmail: string;
  privateKeyPem: string;
  tokenUri?: string;
  fetchFn?: typeof fetch;
}): Promise<string | null> {
  const fetchFn = params.fetchFn ?? fetch;
  const now = Date.now();
  if (cached && cached.expiresAtMs > now + 5 * 60 * 1000) {
    return cached.token;
  }

  const jwt = buildGoogleJwtAssertion({
    clientEmail: params.clientEmail,
    privateKeyPem: params.privateKeyPem,
    tokenUri: params.tokenUri,
  });
  if (!jwt) return null;

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: jwt,
  });

  const res = await fetchFn(DEFAULT_TOKEN_URI, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) return null;

  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  const token = data.access_token;
  const expiresIn = typeof data.expires_in === "number" ? data.expires_in : 3600;
  if (token) {
    cached = { token, expiresAtMs: now + expiresIn * 1000 };
    return token;
  }
  return null;
}

/** Clear cache (e.g. for tests). */
export function clearGoogleTokenCache(): void {
  cached = null;
}
