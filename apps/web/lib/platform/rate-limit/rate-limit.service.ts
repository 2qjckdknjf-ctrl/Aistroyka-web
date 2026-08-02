import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getLimitsForTenant } from "@/lib/platform/subscription/subscription.service";
import { getLimitsForTier, DEFAULT_TIER } from "@/lib/platform/subscription/limits";
import {
  rateLimitKey,
  checkAndIncrement,
  checkAndIncrementMultiStrict,
} from "./rate-limit.store";
import { parseAndNormalizeIp } from "./ip-address";
import type { RateLimitBucketInput } from "./rate-limit-multi.algorithm";

export const HIGH_RISK_ENDPOINTS = [
  "/api/v1/ai/analyze-image",
  "/api/v1/ai/analyze-video-daily",
  "/api/v1/worker/report/submit",
  "/api/v1/jobs/process",
  "/api/v1/analysis/process",
  "/api/analysis/process",
  "/api/auth/login",
] as const;

export const RATE_LIMIT_EXCEEDED_CODE = "rate_limit_exceeded";
export const RATE_LIMIT_UNAVAILABLE_CODE = "rate_limit_unavailable";

const DEFAULT_IP_LIMIT = 10;
/** Stricter limit for auth/login to reduce credential stuffing. */
const LOGIN_IP_LIMIT = 5;
/** Help endpoint caps (never raise above tenant plan). */
const HELP_IP_CAP = 60;
const HELP_USER_LIMIT = 30;
const HELP_TENANT_CAP = 120;
const RETRY_AFTER_SEC = 60;

/** Lowest plan floors (FREE) — used only to document conservatism; lookup failure → 503. */
export const STRICT_PLAN_FLOOR = getLimitsForTier(DEFAULT_TIER);

/** Legacy helper — returns limited flag. Use admin client for rate_limit_slots. */
export async function checkRateLimit(
  supabase: SupabaseClient,
  options: { tenantId: string | null; ip: string; endpoint: string }
): Promise<{ limited: false } | { limited: true; message: string }> {
  const { tenantId, ip, endpoint } = options;
  const safeEndpoint = endpoint.replace(/[^a-z0-9/_-]/gi, "_");

  const isLogin = endpoint === "/api/auth/login";
  let ipLimit = isLogin ? LOGIN_IP_LIMIT : DEFAULT_IP_LIMIT;
  if (tenantId) {
    const limits = await getLimitsForTenant(supabase, tenantId);
    ipLimit = limits.per_minute_rate_limit_ip;
    const tenantKey = rateLimitKey("tenant", tenantId, safeEndpoint);
    const { allowed } = await checkAndIncrement(supabase, tenantKey, limits.per_minute_rate_limit_tenant);
    if (!allowed) return { limited: true, message: "Tenant rate limit exceeded. Try again later." };
  }

  const ipKey = rateLimitKey("ip", ip, safeEndpoint);
  const { allowed } = await checkAndIncrement(supabase, ipKey, ipLimit);
  if (!allowed) {
    return { limited: true, message: "Too many requests from this IP." };
  }

  return { limited: false };
}

export type StrictRateLimitResult =
  | { ok: true }
  | {
      ok: false;
      kind: "limited";
      message: string;
      retryAfterSec: number;
      limit: number;
      dimension: "tenant" | "user" | "ip" | "unknown";
    }
  | { ok: false; kind: "unavailable"; message: string };

function isHelpEndpoint(endpoint: string): boolean {
  return (
    endpoint === "/api/v1/help/assistant" ||
    endpoint === "/api/v1/help/hints" ||
    endpoint === "/api/v1/help/assistant/events"
  );
}

/**
 * Trusted client IP for canonical Cloudflare Worker ingress only.
 *
 * Trust invariant:
 * - `cf-connecting-ip` is trusted ONLY when `AISTROYKA_TRUST_CF_CONNECTING_IP=1`
 *   (set on Worker envs in wrangler). Alternate/direct/Vercel preview/local paths
 *   must leave this unset so a client-supplied header cannot open IP buckets.
 * - Header value must parse as canonical IPv4/IPv6 (`parseAndNormalizeIp`).
 * - Tenant + user limits remain mandatory regardless of IP trust.
 */
export type TrustedClientIp = {
  /** Non-null only when Worker trust flag is on AND IP validates. */
  trustedIp: string | null;
  source: "cf-connecting-ip" | "none";
  reason?:
    | "trust_flag_off"
    | "header_missing"
    | "header_invalid"
    | "trusted";
};

export function isCloudflareWorkerIpTrustEnabled(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
): boolean {
  const raw = (env.AISTROYKA_TRUST_CF_CONNECTING_IP ?? "").trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

export function resolveTrustedClientIp(
  request: {
    headers: { get(name: string): string | null };
  },
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
): TrustedClientIp {
  if (!isCloudflareWorkerIpTrustEnabled(env)) {
    return { trustedIp: null, source: "none", reason: "trust_flag_off" };
  }
  const cf = request.headers.get("cf-connecting-ip")?.trim() ?? "";
  if (!cf) {
    return { trustedIp: null, source: "none", reason: "header_missing" };
  }
  const parsed = parseAndNormalizeIp(cf);
  if (!parsed.ok) {
    return { trustedIp: null, source: "none", reason: "header_invalid" };
  }
  return { trustedIp: parsed.canonical, source: "cf-connecting-ip", reason: "trusted" };
}

/**
 * @deprecated Prefer resolveTrustedClientIp. Returns trusted CF IP or "unknown".
 */
export function clientIpFromRequest(request: Request): string {
  return resolveTrustedClientIp(request).trustedIp ?? "unknown";
}

function limitedMessage(dimension: string): string {
  switch (dimension) {
    case "tenant":
      return "Tenant rate limit exceeded. Try again later.";
    case "user":
      return "User rate limit exceeded. Try again later.";
    case "ip":
      return "Too many requests from this IP.";
    default:
      return "Rate limit exceeded. Try again later.";
  }
}

function asDimension(value: string | null): "tenant" | "user" | "ip" | "unknown" {
  if (value === "tenant" || value === "user" || value === "ip") return value;
  return "unknown";
}

/**
 * Fail-closed rate limit for help / abuse-sensitive writes.
 * - Subscription lookup failure → unavailable (never raise to HELP caps alone).
 * - Effective tenant/IP limits = min(help cap, plan limits) when plan known.
 * - Tenant + user always; IP only when trusted Worker IP present.
 * - Single multi-bucket RPC: all-or-nothing charge.
 */
export async function checkRateLimitStrict(
  supabase: SupabaseClient,
  options: {
    tenantId: string;
    userId: string;
    /** Trusted canonical IP or null to skip IP dimension. */
    ip: string | null;
    endpoint: string;
  }
): Promise<StrictRateLimitResult> {
  const { tenantId, userId, ip, endpoint } = options;
  const safeEndpoint = endpoint.replace(/[^a-z0-9/_-]/gi, "_");
  const help = isHelpEndpoint(endpoint);

  let tenantLimit: number;
  let ipLimit: number;
  let userLimit: number;

  let planLimits;
  try {
    planLimits = await getLimitsForTenant(supabase, tenantId);
  } catch {
    return {
      ok: false,
      kind: "unavailable",
      message: "Rate limit service unavailable.",
    };
  }

  if (
    !planLimits ||
    typeof planLimits.per_minute_rate_limit_tenant !== "number" ||
    typeof planLimits.per_minute_rate_limit_ip !== "number" ||
    planLimits.per_minute_rate_limit_tenant < 1 ||
    planLimits.per_minute_rate_limit_ip < 1
  ) {
    return {
      ok: false,
      kind: "unavailable",
      message: "Rate limit service unavailable.",
    };
  }

  if (help) {
    // Never exceed plan; HELP_* are caps only, not fallbacks on lookup failure.
    tenantLimit = Math.min(HELP_TENANT_CAP, planLimits.per_minute_rate_limit_tenant);
    ipLimit = Math.min(HELP_IP_CAP, planLimits.per_minute_rate_limit_ip);
    userLimit = HELP_USER_LIMIT;
  } else {
    tenantLimit = planLimits.per_minute_rate_limit_tenant;
    ipLimit = planLimits.per_minute_rate_limit_ip;
    userLimit = HELP_USER_LIMIT;
  }

  const buckets: RateLimitBucketInput[] = [
    {
      key: rateLimitKey("tenant", tenantId, safeEndpoint),
      limit: tenantLimit,
      dimension: "tenant",
    },
    {
      key: rateLimitKey("user", userId, safeEndpoint),
      limit: userLimit,
      dimension: "user",
    },
  ];
  if (ip) {
    buckets.push({
      key: rateLimitKey("ip", ip, safeEndpoint),
      limit: ipLimit,
      dimension: "ip",
    });
  }

  const multi = await checkAndIncrementMultiStrict(supabase, buckets);
  if (!multi.ok) {
    return {
      ok: false,
      kind: "unavailable",
      message: "Rate limit service unavailable.",
    };
  }

  if (!multi.result.allowed) {
    const dimension = asDimension(multi.result.limited_dimension);
    const limit =
      typeof multi.result.limit === "number"
        ? multi.result.limit
        : dimension === "tenant"
          ? tenantLimit
          : dimension === "user"
            ? userLimit
            : ipLimit;
    return {
      ok: false,
      kind: "limited",
      message: limitedMessage(dimension),
      retryAfterSec: RETRY_AFTER_SEC,
      limit,
      dimension,
    };
  }

  return { ok: true };
}

export function rateLimitExceededResponse(result: Extract<StrictRateLimitResult, { kind: "limited" }>): NextResponse {
  return NextResponse.json(
    { error: result.message, code: RATE_LIMIT_EXCEEDED_CODE, dimension: result.dimension },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSec),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": "0",
      },
    }
  );
}

export function rateLimitUnavailableResponse(
  message = "Rate limit service unavailable."
): NextResponse {
  return NextResponse.json(
    { error: message, code: RATE_LIMIT_UNAVAILABLE_CODE },
    { status: 503 }
  );
}
