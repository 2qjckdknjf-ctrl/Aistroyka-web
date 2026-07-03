import { PLATFORM_ADMIN_PREFERRED_HOST } from "./constants";

/** True when request host matches configured platform admin host allowlist. */
export function isPlatformAdminHost(host: string | null | undefined): boolean {
  const normalized = (host ?? "").split(":")[0]?.toLowerCase() ?? "";
  if (!normalized) return false;

  const raw = process.env.OWNER_ALLOWED_HOSTS;
  if (typeof raw === "string" && raw.trim() !== "") {
    const allowed = raw
      .split(",")
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean);
    return allowed.includes(normalized);
  }

  return normalized === PLATFORM_ADMIN_PREFERRED_HOST;
}
