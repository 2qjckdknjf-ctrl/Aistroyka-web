import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getPublicEnv } from "@/lib/env";
import { getRequestClientIp, isIpBlockedByOwnerAllowlist } from "./client-ip";
import { isOwnerApiSecretRequired } from "./owner-gate-policy";
import { assertOwnerHttpMethodForRole } from "./owner-capabilities";
import { logOwnerGateEvent } from "./owner-access-log";
import { ownerSecretHeaderValid, readOwnerGateSecretEnv } from "./owner-secret-header";
import { getPlatformOwnerGrant } from "./platform-owner-grant";
import { evaluateOwnerSessionFreshness } from "./owner-session-policy";
import { assertOwnerRateLimit } from "./owner-rate-limit";
import { recordOwnerSecurityAlert, recordOwnerSecurityDenial } from "./owner-security-alerts";
import {
  assertOwnerSurfaceCookieForPage,
  setOwnerSurfaceCookieOnResponse,
} from "./owner-surface-cookie";

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> };

function ownerHostAllowed(request: NextRequest): boolean {
  const raw = process.env.OWNER_ALLOWED_HOSTS;
  if (typeof raw !== "string" || raw.trim() === "") return true;
  const host = (request.headers.get("host") ?? "").split(":")[0]?.toLowerCase() ?? "";
  const allowed = raw
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(host);
}

export function ownerForbiddenResponse(isApi: boolean): NextResponse {
  if (isApi) {
    return NextResponse.json({ error: "forbidden", code: "owner_gate" }, { status: 403 });
  }
  return new NextResponse("Forbidden", {
    status: 403,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export function ownerSessionStaleResponse(isApi: boolean): NextResponse {
  if (isApi) {
    return NextResponse.json(
      { error: "session_stale", code: "owner_session_refresh_required" },
      { status: 401 }
    );
  }
  return new NextResponse("Session refresh required", {
    status: 401,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

function copyCookiesFromSession(from: NextResponse, to: NextResponse): void {
  const list = from.cookies.getAll();
  for (const c of list) {
    to.cookies.set(c.name, c.value, c as never);
  }
}

/**
 * Returns a 403/401 NextResponse when access must be denied; otherwise null.
 * Mutates `sessionResponse` cookies via Supabase client refresh when applicable.
 */
export async function gateOwnerRequest(input: {
  request: NextRequest;
  sessionResponse: NextResponse;
  user: { id: string; email?: string } | null;
  pathname: string;
  isApi: boolean;
}): Promise<NextResponse | null> {
  const { request, sessionResponse, user, pathname, isApi } = input;
  const clientIp = getRequestClientIp(request);

  if (!ownerHostAllowed(request)) {
    logOwnerGateEvent({
      outcome: "deny",
      reason: "host_blocked",
      path: pathname,
      userId: user?.id ?? null,
      clientIp,
      isApi,
    });
    recordOwnerSecurityDenial({ clientIp, reason: "host_blocked", path: pathname });
    const deny = ownerForbiddenResponse(isApi);
    copyCookiesFromSession(sessionResponse, deny);
    return deny;
  }

  if (isIpBlockedByOwnerAllowlist(clientIp, process.env.OWNER_IP_ALLOWLIST)) {
    logOwnerGateEvent({
      outcome: "deny",
      reason: "ip_blocked",
      path: pathname,
      userId: user?.id ?? null,
      clientIp,
      isApi,
    });
    recordOwnerSecurityDenial({ clientIp, reason: "ip_blocked", path: pathname });
    const deny = ownerForbiddenResponse(isApi);
    copyCookiesFromSession(sessionResponse, deny);
    return deny;
  }

  if (!isApi) {
    const surf = await assertOwnerSurfaceCookieForPage(request);
    if (surf === "invalid") {
      logOwnerGateEvent({
        outcome: "deny",
        reason: "surface_invalid",
        path: pathname,
        userId: user?.id ?? null,
        clientIp,
        isApi,
      });
      recordOwnerSecurityDenial({ clientIp, reason: "surface_invalid", path: pathname });
      const deny = ownerForbiddenResponse(isApi);
      copyCookiesFromSession(sessionResponse, deny);
      return deny;
    }
  }

  if (isApi) {
    const secret = readOwnerGateSecretEnv();
    if (secret && isOwnerApiSecretRequired(pathname)) {
      const v = ownerSecretHeaderValid(request, secret);
      if (v !== "ok") {
        logOwnerGateEvent({
          outcome: "deny",
          reason: v === "missing" ? "header_required" : "header_mismatch",
          path: pathname,
          userId: user?.id ?? null,
          clientIp,
          isApi,
        });
        recordOwnerSecurityDenial({ clientIp, reason: "header_gate", path: pathname });
        const deny = ownerForbiddenResponse(isApi);
        copyCookiesFromSession(sessionResponse, deny);
        return deny;
      }
    }
  }

  if (!user?.id) {
    logOwnerGateEvent({
      outcome: "deny",
      reason: "no_session",
      path: pathname,
      userId: null,
      clientIp,
      isApi,
    });
    recordOwnerSecurityDenial({ clientIp, reason: "no_session", path: pathname });
    const deny = ownerForbiddenResponse(isApi);
    copyCookiesFromSession(sessionResponse, deny);
    return deny;
  }

  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getPublicEnv();

  const supabase = createServerClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value, options }) =>
          options != null
            ? sessionResponse.cookies.set(name, value, options as never)
            : sessionResponse.cookies.set(name, value)
        );
      },
    },
  });

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token ?? null;
  const fresh = evaluateOwnerSessionFreshness(accessToken);
  if (fresh.stale) {
    logOwnerGateEvent({
      outcome: "deny",
      reason: "session_stale",
      path: pathname,
      userId: user.id,
      clientIp,
      isApi,
    });
    recordOwnerSecurityDenial({ clientIp, reason: "session_stale", path: pathname });
    const deny = ownerSessionStaleResponse(isApi);
    copyCookiesFromSession(sessionResponse, deny);
    return deny;
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
    recordOwnerSecurityDenial({ clientIp, reason: grant.reason, path: pathname });
    const deny = ownerForbiddenResponse(isApi);
    copyCookiesFromSession(sessionResponse, deny);
    return deny;
  }

  if (isApi) {
    const methodGate = assertOwnerHttpMethodForRole(grant.role, request.method);
    if (methodGate !== "ok") {
      logOwnerGateEvent({
        outcome: "deny",
        reason: "readonly_blocked",
        path: pathname,
        userId: user.id,
        clientIp,
        isApi,
      });
      recordOwnerSecurityDenial({ clientIp, reason: "readonly_blocked", path: pathname });
      recordOwnerSecurityAlert({ alert: "owner_role_mismatch", role: grant.role, path: pathname });
      const deny = ownerForbiddenResponse(isApi);
      copyCookiesFromSession(sessionResponse, deny);
      return deny;
    }
  }

  const admin = getAdminClient();
  const rl = await assertOwnerRateLimit(admin, {
    userId: user.id,
    clientIp,
    surface: isApi ? "owner_api" : "owner_page",
  });
  if (!rl.ok) {
    logOwnerGateEvent({
      outcome: "deny",
      reason: "rate_limited",
      path: pathname,
      userId: user.id,
      clientIp,
      isApi,
    });
    copyCookiesFromSession(sessionResponse, rl.response);
    return rl.response;
  }

  logOwnerGateEvent({
    outcome: "allow",
    path: pathname,
    userId: user.id,
    clientIp,
    isApi,
    role: grant.role,
  });

  if (!isApi) {
    await setOwnerSurfaceCookieOnResponse(sessionResponse);
  }

  return null;
}
