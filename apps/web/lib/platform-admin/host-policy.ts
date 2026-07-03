import { PLATFORM_ADMIN_PREFERRED_HOST } from "./constants";

export type HostProfile = "platform_admin" | "public_product" | "unknown";

const PUBLIC_PRODUCT_HOSTS = new Set([
  "aistroyka.ai",
  "www.aistroyka.ai",
  "staging.aistroyka.ai",
]);

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

export function isPublicProductHost(host: string | null | undefined): boolean {
  const normalized = (host ?? "").split(":")[0]?.toLowerCase() ?? "";
  return PUBLIC_PRODUCT_HOSTS.has(normalized);
}

/** Host classification for routing headers and policy (enforcement is layered in middleware). */
export function resolveHostProfile(host: string | null | undefined): HostProfile {
  if (isPlatformAdminHost(host)) return "platform_admin";
  if (isPublicProductHost(host)) return "public_product";
  return "unknown";
}
