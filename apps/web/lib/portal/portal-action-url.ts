/**
 * Normalize and restrict dynamic portal action URLs to same-origin portal-safe paths.
 * Rejects protocol-relative, external, admin, billing, internal project, and malformed URLs.
 */

const BLOCKED_PREFIXES = [
  "/admin",
  "/billing",
  "/portfolio",
  "/platform-admin",
  "/owner",
  "/team",
  "/subscribe",
] as const;

export type PortalActionUrlDenyReason =
  | "empty"
  | "protocol"
  | "blocked"
  | "unsafe_internal"
  | "malformed";

export type PortalActionUrlResult =
  | { ok: true; href: string }
  | { ok: false; reason: PortalActionUrlDenyReason };

function stripLocalePrefix(pathname: string): string {
  return pathname.replace(/^\/(en|ru|es|it)(?=\/|$)/, "") || "/";
}

function isPortalSafePath(pathname: string): boolean {
  if (pathname === "/portal/projects" || pathname.startsWith("/portal/projects/")) return true;
  if (pathname === "/dashboard/projects") return true;
  if (pathname.startsWith("/dashboard/stakeholder-invite")) return true;
  if (/^\/dashboard\/projects\/[^/]+\/client(\/|$)/.test(pathname)) return true;
  return false;
}

/**
 * Returns a same-app relative path safe for stakeholder navigation, or a denial reason.
 */
export function resolvePortalSafeActionUrl(raw: string | null | undefined): PortalActionUrlResult {
  if (raw == null || typeof raw !== "string" || !raw.trim()) {
    return { ok: false, reason: "empty" };
  }
  const trimmed = raw.trim();

  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) || trimmed.startsWith("//")) {
    return { ok: false, reason: "protocol" };
  }

  let pathname: string;
  let suffix = "";
  try {
    const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed.replace(/^\/+/, "")}`;
    const u = new URL(withSlash, "https://portal.invalid");
    if (u.username || u.password) {
      return { ok: false, reason: "malformed" };
    }
    pathname = stripLocalePrefix(u.pathname);
    suffix = `${u.search}${u.hash}`;
  } catch {
    return { ok: false, reason: "malformed" };
  }

  for (const prefix of BLOCKED_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return { ok: false, reason: "blocked" };
    }
  }

  if (
    pathname === "/projects" ||
    pathname.startsWith("/projects/") ||
    /^\/dashboard\/projects\/[^/]+$/.test(pathname) ||
    /^\/dashboard\/projects\/[^/]+\/(?!client(?:\/|$))/.test(pathname)
  ) {
    return { ok: false, reason: "unsafe_internal" };
  }

  if (!isPortalSafePath(pathname)) {
    return { ok: false, reason: "blocked" };
  }

  return { ok: true, href: `${pathname}${suffix}` };
}

export function portalActionHrefOrFallback(
  raw: string | null | undefined,
  fallback = "/portal/projects"
): string {
  const resolved = resolvePortalSafeActionUrl(raw);
  return resolved.ok ? resolved.href : fallback;
}

export function portalBackLinkForAudience(
  audience: "stakeholder" | "internal",
  projectId: string
): string {
  if (audience === "stakeholder") return "/portal/projects";
  return `/dashboard/projects/${projectId}`;
}

export function shouldShowHandoverPackLink(audience: "stakeholder" | "internal"): boolean {
  // Manager/owner preview may open internal pack page; stakeholders cannot (middleware blocks).
  return audience === "internal";
}
