import type { NextRequest } from "next/server";
import type { NextResponse } from "next/server";

export const OWNER_SURFACE_COOKIE_NAME = "owner_surf";

function readSurfaceSecret(): string | null {
  const v = process.env.OWNER_SURFACE_COOKIE_SECRET;
  if (typeof v !== "string" || v.trim() === "") return null;
  return v.trim();
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

function readMaxAgeSec(): number {
  const v = process.env.OWNER_SURFACE_MAX_AGE_SECONDS;
  const n = v ? Number.parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n > 60 && n <= 3600 ? n : 900;
}

/**
 * Short-lived owner UI ticket (HttpOnly). When secret unset, no extra cookie gate.
 * First navigation may omit cookie; invalid cookie denies.
 */
/** Server layout / RSC: same rules as middleware (missing cookie allowed on first paint). */
export async function verifyOwnerSurfaceCookieRaw(
  raw: string | null | undefined
): Promise<"ok" | "invalid"> {
  const secret = readSurfaceSecret();
  if (!secret) return "ok";
  if (!raw) return "ok";

  const [tsPart, sig] = raw.split(".");
  const ts = Number.parseInt(tsPart ?? "", 10);
  if (!Number.isFinite(ts) || !sig) return "invalid";
  const now = Math.floor(Date.now() / 1000);
  if (now - ts > readMaxAgeSec()) return "invalid";
  const expected = await hmacHex(secret, `${ts}`);
  if (expected !== sig) return "invalid";
  return "ok";
}

export async function assertOwnerSurfaceCookieForPage(
  request: NextRequest
): Promise<"ok" | "invalid"> {
  return verifyOwnerSurfaceCookieRaw(request.cookies.get(OWNER_SURFACE_COOKIE_NAME)?.value);
}

export async function setOwnerSurfaceCookieOnResponse(response: NextResponse): Promise<void> {
  const secret = readSurfaceSecret();
  if (!secret) return;
  const ts = Math.floor(Date.now() / 1000);
  const sig = await hmacHex(secret, `${ts}`);
  const value = `${ts}.${sig}`;
  response.cookies.set(OWNER_SURFACE_COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: readMaxAgeSec(),
  });
}
