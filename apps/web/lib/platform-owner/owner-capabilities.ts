import type { PlatformOwnerRole } from "./constants";
import { PLATFORM_OWNER_ROLES } from "./constants";

const WRITE_ROLES: ReadonlySet<PlatformOwnerRole> = new Set(["OWNER", "OWNER_OPERATOR"]);

const CRITICAL_ROLES: ReadonlySet<PlatformOwnerRole> = new Set(["OWNER"]);

/**
 * Exact path for the one non-persistent read-mode POST that OWNER_READONLY may call.
 * Segment-safe: equality only — never prefix-match `/testing/**` or arbitrary read POSTs.
 */
export const OWNER_READONLY_ALLOWED_POST_PATH =
  "/api/v1/platform/testing/safe-audit/refresh" as const;

export function parsePlatformOwnerRole(value: string | null | undefined): PlatformOwnerRole | null {
  if (!value) return null;
  const v = value.trim() as PlatformOwnerRole;
  return (PLATFORM_OWNER_ROLES as readonly string[]).includes(v) ? v : null;
}

export function ownerRoleCanRead(role: PlatformOwnerRole): boolean {
  return true;
}

export function ownerRoleCanWrite(role: PlatformOwnerRole): boolean {
  return WRITE_ROLES.has(role);
}

/** Full owner only (not operator / not readonly). */
export function ownerRoleCanCritical(role: PlatformOwnerRole): boolean {
  return CRITICAL_ROLES.has(role);
}

/**
 * Exact method + path exception for OWNER_READONLY (and other non-write roles).
 * Shared by middleware `gateOwnerRequest` and `requirePlatformOwnerApi`.
 */
export function isOwnerReadonlyAllowedMutation(
  method: string,
  pathname: string
): boolean {
  const m = (method || "GET").toUpperCase();
  if (m !== "POST") return false;
  return pathname === OWNER_READONLY_ALLOWED_POST_PATH;
}

export function assertOwnerHttpMethodForRole(
  role: PlatformOwnerRole,
  method: string,
  pathname?: string
): "ok" | "readonly_blocked" {
  const m = (method || "GET").toUpperCase();
  if (m === "GET" || m === "HEAD" || m === "OPTIONS") return "ok";
  if (ownerRoleCanWrite(role)) return "ok";
  if (pathname != null && isOwnerReadonlyAllowedMutation(m, pathname)) return "ok";
  return "readonly_blocked";
}
