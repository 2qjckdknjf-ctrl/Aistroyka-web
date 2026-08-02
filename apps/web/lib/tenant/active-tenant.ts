/**
 * Explicit active-tenant selection (Phase 2C / T-P2-1) — hardened.
 *
 * Priority when a Request/Headers is supplied:
 * 1. Validated `x-tenant-id` header (if the header key is present at all)
 * 2. Else validated `aistroyka_active_tenant` cookie (exactly one name occurrence)
 * 3. Else owned tenant (deterministic: lowest `tenants.id`)
 * 4. Else membership (deterministic: lowest `tenant_members.tenant_id`)
 *
 * Fail-closed rules:
 * - Present but invalid/unauthorized explicit claim → null (never fall back)
 * - Duplicate same-name cookies → null (ambiguous; never pick first/last)
 * - Query errors during access check or fallback → null (never silently pick another tenant)
 * - Blocked resolution must never trigger workspace auto-create / false onboarding
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export const ACTIVE_TENANT_HEADER = "x-tenant-id";
export const ACTIVE_TENANT_COOKIE = "aistroyka_active_tenant";
export const ACTIVE_TENANT_COOKIE_PATH = "/";
/** 180 days — long-lived workspace preference, not a session token. */
export const ACTIVE_TENANT_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 180;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ActiveTenantSource = "header" | "cookie" | "owned" | "membership" | "none";

export type ResolveActiveTenantResult = {
  tenantId: string | null;
  source: ActiveTenantSource;
  /** True when an explicit header/cookie was sent but rejected (invalid, unauthorized, duplicate, or DB error). */
  explicitRejected: boolean;
  /** True when a DB/query error forced fail-closed null. */
  queryError: boolean;
};

export type ActiveTenantRequestLike = Request | Headers | { headers: Headers };

export function isTenantIdFormat(value: string): boolean {
  return UUID_RE.test(value.trim());
}

/** True when callers must not auto-create, fall back, or invent onboarding state. */
export function isActiveTenantResolutionBlocked(result: ResolveActiveTenantResult): boolean {
  return result.explicitRejected || result.queryError;
}

/**
 * Normalize Request / Next.js Headers into a Request for candidate reads.
 * Uses a stable synthetic URL (only headers matter).
 */
export function asActiveTenantRequest(
  input?: ActiveTenantRequestLike | null
): Request | null {
  if (input == null) return null;
  if (typeof Request !== "undefined" && input instanceof Request) return input;
  if (typeof Headers !== "undefined" && input instanceof Headers) {
    return new Request("https://aistroyka.local/active-tenant", { headers: input });
  }
  if (typeof input === "object" && "headers" in input && input.headers instanceof Headers) {
    return new Request("https://aistroyka.local/active-tenant", { headers: input.headers });
  }
  return null;
}

export type NamedCookieRead =
  | { status: "absent" }
  | { status: "ok"; value: string }
  | { status: "empty" }
  | { status: "duplicate" };

/**
 * Strict cookie read: duplicate same-name entries are ambiguous (path/shadowing)
 * and fail closed — never first-wins or last-wins.
 */
export function readNamedCookieStrict(
  cookieHeader: string | null,
  name: string
): NamedCookieRead {
  if (!cookieHeader) return { status: "absent" };
  const values: string[] = [];
  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx <= 0) continue;
    const key = part.slice(0, idx).trim();
    if (key !== name) continue;
    const raw = part.slice(idx + 1).trim();
    if (!raw) {
      values.push("");
      continue;
    }
    try {
      values.push(decodeURIComponent(raw));
    } catch {
      values.push(raw);
    }
  }
  if (values.length === 0) return { status: "absent" };
  if (values.length > 1) return { status: "duplicate" };
  const only = values[0]!.trim();
  if (!only) return { status: "empty" };
  return { status: "ok", value: only };
}

/** @deprecated Prefer readNamedCookieStrict — duplicate cookies must fail closed. */
export function readCookieValue(cookieHeader: string | null, name: string): string | null {
  const read = readNamedCookieStrict(cookieHeader, name);
  if (read.status === "ok") return read.value;
  return null;
}

export type ActiveTenantCookieWriteOptions = {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: typeof ACTIVE_TENANT_COOKIE_PATH;
  maxAge: number;
};

export function activeTenantCookieSetOptions(): ActiveTenantCookieWriteOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: ACTIVE_TENANT_COOKIE_PATH,
    maxAge: ACTIVE_TENANT_COOKIE_MAX_AGE_SEC,
  };
}

export function activeTenantCookieClearOptions(): ActiveTenantCookieWriteOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: ACTIVE_TENANT_COOKIE_PATH,
    maxAge: 0,
  };
}

/**
 * CSRF/same-origin gate for cookie-authenticated active-tenant mutations.
 *
 * Accept only when there is positive same-origin proof:
 * - `Origin` present and its host equals `Host`, or
 * - `Origin` absent and `Sec-Fetch-Site: same-origin` (browser fetch metadata)
 *
 * Fail closed on: missing both, cross-site, same-site without matching Origin,
 * foreign/mismatched Origin, invalid Origin, empty Origin.
 * Absence of Origin alone is never sufficient.
 */
export function assertSameOriginMutation(
  request: Request
): { ok: true } | { ok: false; status: 403; error: string } {
  const site = (request.headers.get("sec-fetch-site") ?? "").trim().toLowerCase();
  if (site === "cross-site") {
    return { ok: false, status: 403, error: "Cross-site request rejected." };
  }

  const host = (request.headers.get("host") ?? "").trim();
  const originHeader = request.headers.get("origin");

  if (originHeader !== null) {
    const origin = originHeader.trim();
    if (!origin) {
      return { ok: false, status: 403, error: "Invalid Origin." };
    }
    try {
      const originHost = new URL(origin).host;
      if (!host || originHost !== host) {
        return { ok: false, status: 403, error: "Origin mismatch." };
      }
      return { ok: true };
    } catch {
      return { ok: false, status: 403, error: "Invalid Origin." };
    }
  }

  // No Origin: require explicit browser same-origin fetch signal (not same-site/none/empty).
  if (site === "same-origin") {
    if (!host) {
      return { ok: false, status: 403, error: "Missing Host." };
    }
    return { ok: true };
  }

  return { ok: false, status: 403, error: "Missing same-origin proof." };
}

/**
 * Reads explicit tenant candidate from request (header wins over cookie).
 * If the header key is present (even empty/invalid), cookie is not consulted.
 * Does not validate membership.
 */
export function readActiveTenantCandidate(request: Request): {
  tenantId: string | null;
  source: "header" | "cookie" | null;
  headerPresent: boolean;
  cookieDuplicate: boolean;
} {
  const headerRaw = request.headers.get(ACTIVE_TENANT_HEADER);
  if (headerRaw !== null) {
    return {
      tenantId: headerRaw.trim() || null,
      source: "header",
      headerPresent: true,
      cookieDuplicate: false,
    };
  }

  const cookie = readNamedCookieStrict(request.headers.get("cookie"), ACTIVE_TENANT_COOKIE);
  if (cookie.status === "duplicate") {
    return {
      tenantId: null,
      source: "cookie",
      headerPresent: false,
      cookieDuplicate: true,
    };
  }
  if (cookie.status === "ok") {
    return {
      tenantId: cookie.value,
      source: "cookie",
      headerPresent: false,
      cookieDuplicate: false,
    };
  }
  if (cookie.status === "empty") {
    return {
      tenantId: null,
      source: "cookie",
      headerPresent: false,
      cookieDuplicate: false,
    };
  }

  return { tenantId: null, source: null, headerPresent: false, cookieDuplicate: false };
}

type AccessCheck =
  | { ok: true; allowed: boolean }
  | { ok: false; queryError: true };

export async function userCanAccessTenant(
  supabase: SupabaseClient,
  userId: string,
  tenantId: string
): Promise<AccessCheck> {
  const ownedRes = await supabase
    .from("tenants")
    .select("id")
    .eq("id", tenantId)
    .eq("user_id", userId)
    .maybeSingle();
  if (ownedRes.error) return { ok: false, queryError: true };
  if (ownedRes.data?.id) return { ok: true, allowed: true };

  const memberRes = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .maybeSingle();
  if (memberRes.error) return { ok: false, queryError: true };
  return { ok: true, allowed: Boolean(memberRes.data?.tenant_id) };
}

type IdLookup =
  | { ok: true; id: string | null }
  | { ok: false; queryError: true };

/** Deterministic owned tenant: lowest `id` when user owns multiple. */
async function resolveOwnedTenantId(
  supabase: SupabaseClient,
  userId: string
): Promise<IdLookup> {
  const res = await supabase
    .from("tenants")
    .select("id")
    .eq("user_id", userId)
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (res.error) return { ok: false, queryError: true };
  return { ok: true, id: res.data?.id ?? null };
}

async function resolveDeterministicMembershipTenantId(
  supabase: SupabaseClient,
  userId: string
): Promise<IdLookup> {
  const res = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", userId)
    .order("tenant_id", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (res.error) return { ok: false, queryError: true };
  return { ok: true, id: res.data?.tenant_id ?? null };
}

function noneResult(opts: {
  explicitRejected?: boolean;
  queryError?: boolean;
}): ResolveActiveTenantResult {
  return {
    tenantId: null,
    source: "none",
    explicitRejected: opts.explicitRejected ?? false,
    queryError: opts.queryError ?? false,
  };
}

/**
 * Resolve active tenant for a user.
 * Pass Request (or Headers) whenever the caller has HTTP context so header/cookie apply.
 */
export async function resolveActiveTenantId(
  supabase: SupabaseClient,
  userId: string,
  requestLike?: ActiveTenantRequestLike | null
): Promise<ResolveActiveTenantResult> {
  const request = asActiveTenantRequest(requestLike);

  if (request) {
    const candidate = readActiveTenantCandidate(request);
    if (candidate.cookieDuplicate) {
      return noneResult({ explicitRejected: true });
    }
    if (candidate.headerPresent || candidate.source === "cookie") {
      const raw = candidate.tenantId;
      if (!raw || !isTenantIdFormat(raw)) {
        return noneResult({ explicitRejected: true });
      }
      const access = await userCanAccessTenant(supabase, userId, raw);
      if (!access.ok) {
        return noneResult({ explicitRejected: true, queryError: true });
      }
      if (!access.allowed) {
        return noneResult({ explicitRejected: true });
      }
      return {
        tenantId: raw,
        source: candidate.source === "header" || candidate.headerPresent ? "header" : "cookie",
        explicitRejected: false,
        queryError: false,
      };
    }
  }

  const owned = await resolveOwnedTenantId(supabase, userId);
  if (!owned.ok) return noneResult({ queryError: true });
  if (owned.id) {
    return { tenantId: owned.id, source: "owned", explicitRejected: false, queryError: false };
  }

  const membership = await resolveDeterministicMembershipTenantId(supabase, userId);
  if (!membership.ok) return noneResult({ queryError: true });
  if (membership.id) {
    return {
      tenantId: membership.id,
      source: "membership",
      explicitRejected: false,
      queryError: false,
    };
  }

  return noneResult({});
}
