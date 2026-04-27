function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

async function hmacSha256Base64Url(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  const bytes = new Uint8Array(sig);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Critical owner mutations require `X-Owner-Step-Up` when `OWNER_STEP_UP_SECRET` is set.
 * Token = base64url(HMAC-SHA256(secret, `${userId}|${method}|${path}|${hourUtc}`)) for hour and hour-1 (skew).
 */
export async function verifyOwnerStepUpHeader(
  secret: string,
  userId: string,
  method: string,
  pathname: string,
  headerValue: string | null | undefined
): Promise<boolean> {
  const sent = headerValue?.trim() ?? "";
  if (!sent) return false;
  const hour = Math.floor(Date.now() / 3600000);
  const windows = [hour, hour - 1];
  for (const h of windows) {
    const payload = `${userId}|${method}|${pathname}|${h}`;
    const expected = await hmacSha256Base64Url(secret, payload);
    if (timingSafeEqual(sent, expected)) return true;
  }
  return false;
}

export function readOwnerStepUpSecret(): string | null {
  const v = process.env.OWNER_STEP_UP_SECRET;
  if (typeof v !== "string" || v.trim() === "") return null;
  return v.trim();
}
