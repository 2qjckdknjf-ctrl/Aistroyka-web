import type { PlatformOwnerRole } from "./constants";
import { PLATFORM_OWNER_ROLES } from "./constants";

const WRITE_ROLES: ReadonlySet<PlatformOwnerRole> = new Set(["OWNER", "OWNER_OPERATOR"]);

const CRITICAL_ROLES: ReadonlySet<PlatformOwnerRole> = new Set(["OWNER"]);

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

export function assertOwnerHttpMethodForRole(
  role: PlatformOwnerRole,
  method: string
): "ok" | "readonly_blocked" {
  const m = (method || "GET").toUpperCase();
  if (m === "GET" || m === "HEAD" || m === "OPTIONS") return "ok";
  if (!ownerRoleCanWrite(role)) return "readonly_blocked";
  return "ok";
}
