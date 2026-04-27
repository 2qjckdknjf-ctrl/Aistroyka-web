/** Decode JWT payload without verification (iat/exp/auth_time hints only). */

export type JwtPayloadHints = {
  iat?: number;
  exp?: number;
  auth_time?: number;
  aal?: string;
};

export function decodeJwtPayload(token: string): JwtPayloadHints | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const raw = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json =
      typeof atob !== "undefined"
        ? atob(raw)
        : typeof Buffer !== "undefined"
          ? Buffer.from(raw, "base64").toString("utf8")
          : "";
    if (!json) return null;
    return JSON.parse(json) as JwtPayloadHints;
  } catch {
    return null;
  }
}
