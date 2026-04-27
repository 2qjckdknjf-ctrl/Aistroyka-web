import { decodeJwtPayload } from "./owner-jwt";

function readIntEnv(name: string, fallback: number): number {
  const v = process.env[name];
  if (typeof v !== "string" || v.trim() === "") return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export type SessionStaleReason = "iat_max_age" | "auth_time_max_age" | "expired";

/**
 * Enforces maximum **access token** age (iat) and optional auth_time freshness.
 * Does not replace Supabase refresh; returns stale when re-login/refresh is required.
 */
export function evaluateOwnerSessionFreshness(accessToken: string | null | undefined): {
  stale: boolean;
  reason?: SessionStaleReason;
} {
  if (!accessToken) return { stale: true, reason: "expired" };

  const payload = decodeJwtPayload(accessToken);
  if (!payload) return { stale: false };

  const now = Math.floor(Date.now() / 1000);

  if (typeof payload.exp === "number" && payload.exp <= now) {
    return { stale: true, reason: "expired" };
  }

  const maxIatMin = readIntEnv("OWNER_MAX_SESSION_IAT_AGE_MINUTES", 0);
  if (maxIatMin > 0 && typeof payload.iat === "number") {
    const ageSec = now - payload.iat;
    if (ageSec > maxIatMin * 60) {
      return { stale: true, reason: "iat_max_age" };
    }
  }

  const maxAuthMin = readIntEnv("OWNER_MAX_AUTH_TIME_AGE_MINUTES", 0);
  if (maxAuthMin > 0 && typeof payload.auth_time === "number") {
    const ageSec = now - payload.auth_time;
    if (ageSec > maxAuthMin * 60) {
      return { stale: true, reason: "auth_time_max_age" };
    }
  }

  return { stale: false };
}
