import { NextResponse } from "next/server";
import {
  createClientFromRequest,
  getSessionUser,
  safeGetSession,
  ServiceRoleForbiddenError,
} from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getRequestClientIp, isIpBlockedByOwnerAllowlist } from "./client-ip";
import { OWNER_STEP_UP_HEADER } from "./constants";
import type { PlatformOwnerRole } from "./constants";
import { OWNER_RATE_LIMIT_ALREADY_APPLIED_HEADER } from "./constants";
import { isOwnerApiSecretRequired } from "./owner-gate-policy";
import {
  assertOwnerHttpMethodForRole,
  ownerRoleCanCritical,
  ownerRoleCanWrite,
} from "./owner-capabilities";
import { logOwnerGateEvent } from "./owner-access-log";
import { ownerSecretHeaderValid, readOwnerGateSecretEnv } from "./owner-secret-header";
import { getPlatformOwnerGrant } from "./platform-owner-grant";
import { evaluateOwnerSessionFreshness } from "./owner-session-policy";
import { assertOwnerRateLimit } from "./owner-rate-limit";
import { recordOwnerSecurityAlert, recordOwnerSecurityDenial } from "./owner-security-alerts";
import { readOwnerStepUpSecret, verifyOwnerStepUpHeader } from "./owner-step-up";
import { insertPlatformOwnerAudit } from "./owner-audit.service";

function ownerHostAllowedFromUrl(url: string): boolean {
  const raw = process.env.OWNER_ALLOWED_HOSTS;
  if (typeof raw !== "string" || raw.trim() === "") return true;
  let host = "";
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return false;
  }
  const allowed = raw
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(host);
}

export type OwnerApiGuardMode = "read" | "write" | "critical";

export type OwnerApiAuthOk = {
  ok: true;
  supabase: Awaited<ReturnType<typeof createClientFromRequest>>;
  userId: string;
  role: PlatformOwnerRole;
};

/**
 * Enforces the same rules as middleware for `/api/v1/owner/*` (defense in depth), plus:
 * session freshness, tiered roles, rate limits, optional critical step-up, DB audit rows.
 */
export async function requirePlatformOwnerApi(
  request: Request,
  opts?: { mode?: OwnerApiGuardMode }
): Promise<OwnerApiAuthOk | { ok: false; response: NextResponse }> {
  const mode: OwnerApiGuardMode = opts?.mode ?? "read";
  let pathname = "/api/v1/owner";
  try {
    pathname = new URL(request.url).pathname;
  } catch {
    /* keep default */
  }

  const isApi = true;
  const clientIp = getRequestClientIp(request);
  const method = (request.method || "GET").toUpperCase();

  const auditDenied = process.env.OWNER_AUDIT_DENIED === "1";

  if (!ownerHostAllowedFromUrl(request.url)) {
    logOwnerGateEvent({
      outcome: "deny",
      reason: "host_blocked",
      path: pathname,
      userId: null,
      clientIp,
      isApi,
    });
    recordOwnerSecurityDenial({ clientIp, reason: "host_blocked", path: pathname });
    const admin = getAdminClient();
    if (auditDenied) {
      await insertPlatformOwnerAudit(admin, {
        user_id: null,
        action: "owner_api_denied",
        entity: "owner_api",
        entity_id: pathname,
        metadata: { reason: "host_blocked", method },
        ip: clientIp,
      });
    }
    return { ok: false, response: NextResponse.json({ error: "forbidden", code: "owner_gate" }, { status: 403 }) };
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
    recordOwnerSecurityDenial({ clientIp, reason: "ip_blocked", path: pathname });
    const admin = getAdminClient();
    if (auditDenied) {
      await insertPlatformOwnerAudit(admin, {
        user_id: null,
        action: "owner_api_denied",
        entity: "owner_api",
        entity_id: pathname,
        metadata: { reason: "ip_blocked", method },
        ip: clientIp,
      });
    }
    return { ok: false, response: NextResponse.json({ error: "forbidden", code: "owner_gate" }, { status: 403 }) };
  }

  const secret = readOwnerGateSecretEnv();
  if (secret && isOwnerApiSecretRequired(pathname)) {
    const v = ownerSecretHeaderValid(request, secret);
    if (v !== "ok") {
      logOwnerGateEvent({
        outcome: "deny",
        reason: v === "missing" ? "header_required" : "header_mismatch",
        path: pathname,
        userId: null,
        clientIp,
        isApi,
      });
      recordOwnerSecurityDenial({ clientIp, reason: "header_gate", path: pathname });
      const admin = getAdminClient();
      if (auditDenied) {
        await insertPlatformOwnerAudit(admin, {
          user_id: null,
          action: "owner_api_denied",
          entity: "owner_api",
          entity_id: pathname,
          metadata: { reason: "header_gate", method },
          ip: clientIp,
        });
      }
      return { ok: false, response: NextResponse.json({ error: "forbidden", code: "owner_gate" }, { status: 403 }) };
    }
  }

  let supabase: Awaited<ReturnType<typeof createClientFromRequest>>;
  try {
    supabase = await createClientFromRequest(request);
  } catch (e) {
    if (e instanceof ServiceRoleForbiddenError) {
      return { ok: false, response: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
    }
    throw e;
  }

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
    recordOwnerSecurityDenial({ clientIp, reason: "session_stale", path: pathname });
    const admin = getAdminClient();
    if (auditDenied) {
      await insertPlatformOwnerAudit(admin, {
        user_id: sess?.user.id ?? null,
        action: "owner_api_denied",
        entity: "owner_api",
        entity_id: pathname,
        metadata: { reason: "session_stale", method, detail: fresh.reason },
        ip: clientIp,
      });
    }
    return {
      ok: false,
      response: NextResponse.json(
        { error: "session_stale", code: "owner_session_refresh_required" },
        { status: 401 }
      ),
    };
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
    recordOwnerSecurityDenial({ clientIp, reason: "no_session", path: pathname });
    const admin = getAdminClient();
    if (auditDenied) {
      await insertPlatformOwnerAudit(admin, {
        user_id: null,
        action: "owner_api_denied",
        entity: "owner_api",
        entity_id: pathname,
        metadata: { reason: "no_session", method },
        ip: clientIp,
      });
    }
    return { ok: false, response: NextResponse.json({ error: "forbidden", code: "owner_gate" }, { status: 403 }) };
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
    const admin = getAdminClient();
    if (auditDenied) {
      await insertPlatformOwnerAudit(admin, {
        user_id: user.id,
        action: "owner_api_denied",
        entity: "owner_api",
        entity_id: pathname,
        metadata: { reason: grant.reason, method },
        ip: clientIp,
      });
    }
    return { ok: false, response: NextResponse.json({ error: "forbidden", code: "owner_gate" }, { status: 403 }) };
  }

  const role = grant.role;

  if (assertOwnerHttpMethodForRole(role, method) !== "ok") {
    logOwnerGateEvent({
      outcome: "deny",
      reason: "readonly_blocked",
      path: pathname,
      userId: user.id,
      clientIp,
      isApi,
    });
    recordOwnerSecurityDenial({ clientIp, reason: "readonly_blocked", path: pathname });
    const admin = getAdminClient();
    if (auditDenied) {
      await insertPlatformOwnerAudit(admin, {
        user_id: user.id,
        action: "owner_api_denied",
        entity: "owner_api",
        entity_id: pathname,
        metadata: { reason: "readonly_blocked", method, role },
        ip: clientIp,
      });
    }
    return { ok: false, response: NextResponse.json({ error: "forbidden", code: "owner_readonly" }, { status: 403 }) };
  }

  if (mode === "write" && !ownerRoleCanWrite(role)) {
    return { ok: false, response: NextResponse.json({ error: "forbidden", code: "owner_write_required" }, { status: 403 }) };
  }

  if (mode === "critical") {
    if (!ownerRoleCanCritical(role)) {
      recordOwnerSecurityAlert({
        alert: "owner_critical_role_mismatch",
        userId: user.id,
        role,
        path: pathname,
      });
      return {
        ok: false,
        response: NextResponse.json({ error: "forbidden", code: "owner_critical_role" }, { status: 403 }),
      };
    }
    const stepSecret = readOwnerStepUpSecret();
    if (!stepSecret) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "misconfigured", code: "owner_step_up_secret_missing" },
          { status: 503 }
        ),
      };
    }
    const okStep = await verifyOwnerStepUpHeader(
      stepSecret,
      user.id,
      method,
      pathname,
      request.headers.get(OWNER_STEP_UP_HEADER)
    );
    if (!okStep) {
      recordOwnerSecurityDenial({ clientIp, reason: "step_up_required", path: pathname });
      return {
        ok: false,
        response: NextResponse.json({ error: "forbidden", code: "owner_step_up_required" }, { status: 403 }),
      };
    }
  }

  const middlewareRateLimitApplied = request.headers.get(OWNER_RATE_LIMIT_ALREADY_APPLIED_HEADER) === "1";
  if (!middlewareRateLimitApplied) {
    const admin = getAdminClient();
    const rl = await assertOwnerRateLimit(admin, {
      userId: user.id,
      clientIp,
      surface: "owner_api",
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
      return { ok: false, response: rl.response };
    }
  }

  logOwnerGateEvent({
    outcome: "allow",
    path: pathname,
    userId: user.id,
    clientIp,
    isApi,
    role,
  });

  const admin = getAdminClient();
  await insertPlatformOwnerAudit(admin, {
    user_id: user.id,
    action: `owner_api_${method}`,
    entity: "owner_api",
    entity_id: pathname,
    metadata: { mode, role },
    ip: clientIp,
  });

  return { ok: true, supabase, userId: user.id, role };
}
