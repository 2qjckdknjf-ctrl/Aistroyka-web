import { cookies } from "next/headers";
import { headers } from "next/headers";
import { forbidden, redirect } from "next/navigation";
import { createClient, getSessionUser, safeGetSession } from "@/lib/supabase/server";
import { getRequestClientIp, isIpBlockedByOwnerAllowlist } from "./client-ip";
import { logOwnerGateEvent } from "./owner-access-log";
import { getPlatformOwnerGrant } from "./platform-owner-grant";
import { evaluateOwnerSessionFreshness } from "./owner-session-policy";
import { OWNER_SURFACE_COOKIE_NAME, verifyOwnerSurfaceCookieRaw } from "./owner-surface-cookie";

function resolveReturnPath(locale: string, headerPath: string | null): string {
  if (headerPath && headerPath.startsWith("/")) return headerPath;
  return `/${locale}/platform-admin`;
}

/**
 * Server layout guard for platform-admin pages (middleware is primary; defense in depth).
 * Re-validates session freshness, surface ticket (when configured), and grant tier.
 */
export async function assertPlatformOwnerPageAccess(input: {
  locale: string;
  returnPath?: string;
}): Promise<void> {
  const h = await headers();
  const pathname = resolveReturnPath(input.locale, input.returnPath ?? h.get("x-aistroyka-pathname"));
  const isApi = false;
  const clientIp = getRequestClientIp({ headers: h });

  const host = (h.get("host") ?? "").split(":")[0]?.toLowerCase() ?? "";
  const rawHosts = process.env.OWNER_ALLOWED_HOSTS;
  if (typeof rawHosts === "string" && rawHosts.trim() !== "") {
    const allowed = rawHosts
      .split(",")
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean);
    if (!allowed.includes(host)) {
      logOwnerGateEvent({
        outcome: "deny",
        reason: "host_blocked",
        path: pathname,
        userId: null,
        clientIp,
        isApi,
      });
      forbidden();
    }
  }

  if (isIpBlockedByOwnerAllowlist(clientIp, process.env.OWNER_IP_ALLOWLIST)) {
    logOwnerGateEvent({
      outcome: "deny",
      reason: "ip_blocked",
      path: pathname,
      userId: null,
      clientIp,
      isApi,
    });
    forbidden();
  }

  const jar = await cookies();
  const surf = await verifyOwnerSurfaceCookieRaw(jar.get(OWNER_SURFACE_COOKIE_NAME)?.value);
  if (surf === "invalid") {
    logOwnerGateEvent({
      outcome: "deny",
      reason: "surface_invalid",
      path: pathname,
      userId: null,
      clientIp,
      isApi,
    });
    forbidden();
  }

  const supabase = await createClient();
  const sess = await safeGetSession(supabase);
  const accessToken = sess?.access_token ?? null;
  const fresh = evaluateOwnerSessionFreshness(accessToken);
  if (fresh.stale) {
    logOwnerGateEvent({
      outcome: "deny",
      reason: "session_stale",
      path: pathname,
      userId: sess?.user.id ?? null,
      clientIp,
      isApi,
    });
    redirect(`/${input.locale}/login?next=${encodeURIComponent(pathname)}`);
  }

  const user = await getSessionUser(supabase);
  if (!user?.id) {
    logOwnerGateEvent({
      outcome: "deny",
      reason: "no_session",
      path: pathname,
      userId: null,
      clientIp,
      isApi,
    });
    redirect(`/${input.locale}/login?next=${encodeURIComponent(pathname)}`);
  }

  const grant = await getPlatformOwnerGrant(supabase, user.id);
  if (!grant.ok) {
    logOwnerGateEvent({
      outcome: "deny",
      reason: grant.reason === "db_error" ? "supabase_error" : "no_grant",
      path: pathname,
      userId: user.id,
      clientIp,
      isApi,
    });
    forbidden();
  }

  logOwnerGateEvent({
    outcome: "allow",
    path: pathname,
    userId: user.id,
    clientIp,
    isApi,
    role: grant.role,
  });
}
