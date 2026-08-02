/**
 * Shared guards/contracts for /api/v1/help/* write routes (2C_lite_idempotency_rate_limits).
 *
 * Auth decision: tenant-authenticated. Dashboard/mobile already send credentials;
 * role/counts in body are UX hints only — never authorize or invent tenant state from them.
 *
 * Abuse order (documented):
 * 1) auth
 * 2) peek completed lite idempotency replay (no rate charge)
 * 3) rate limit (tenant+user always; trusted CF IP when present)
 * 4) strict claim for new/pending work (rate-limited — no abuse bypass)
 * 5) handler → finalize (503 on finalize failure; leave pending)
 */

import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  checkRateLimitStrict,
  rateLimitExceededResponse,
  rateLimitUnavailableResponse,
  resolveTrustedClientIp,
} from "@/lib/platform/rate-limit/rate-limit.service";
import {
  claimLiteIdempotencyStrict,
  peekCompletedLiteIdempotency,
  releaseLiteIdempotency,
  storeLiteIdempotency,
} from "@/lib/api/lite-idempotency";
import {
  getTenantContextFromRequest,
  requireTenant,
  TenantRequiredError,
  type TenantContext,
} from "@/lib/tenant";

export const HELP_MAX_BODY_BYTES = 16_384;
export const HELP_MAX_QUERY_LEN = 2_000;
export const HELP_MAX_PATHNAME_LEN = 512;
export const HELP_MAX_ROLE_LEN = 32;
export const HELP_MAX_LOCALE_LEN = 16;
export const HELP_MAX_HISTORY = 10;
export const HELP_MAX_HISTORY_ITEM_LEN = 500;
export const HELP_MAX_PAYLOAD_KEYS = 16;
export const HELP_MAX_PAYLOAD_STRING_LEN = 500;

export const HELP_EVENT_TYPES = ["open", "ask", "quick_prompt", "action_click"] as const;
export type HelpEventType = (typeof HELP_EVENT_TYPES)[number];

export function isHelpEventType(value: unknown): value is HelpEventType {
  return typeof value === "string" && (HELP_EVENT_TYPES as readonly string[]).includes(value);
}

export function rejectIfBodyTooLarge(request: Request): NextResponse | null {
  const cl = request.headers.get("content-length");
  if (cl) {
    const n = Number(cl);
    if (Number.isFinite(n) && n > HELP_MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: "Payload too large", code: "payload_too_large" },
        { status: 413 }
      );
    }
  }
  return null;
}

export async function requireHelpTenant(request: Request): Promise<
  | { ok: true; ctx: TenantContext }
  | { ok: false; response: NextResponse }
> {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (error) {
    if (error instanceof TenantRequiredError) {
      const status = error.message.includes("membership") ? 403 : 401;
      return {
        ok: false,
        response: NextResponse.json({ error: error.message, code: "unauthorized" }, { status }),
      };
    }
    throw error;
  }
  return { ok: true, ctx: ctx as TenantContext };
}

export async function enforceHelpRateLimit(
  request: Request,
  ctx: TenantContext,
  endpoint: string
): Promise<NextResponse | null> {
  const admin = getAdminClient();
  if (!admin) {
    return rateLimitUnavailableResponse();
  }
  const { trustedIp } = resolveTrustedClientIp(request);
  const result = await checkRateLimitStrict(admin, {
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    ip: trustedIp,
    endpoint,
  });
  if (result.ok) return null;
  if (result.kind === "unavailable") return rateLimitUnavailableResponse(result.message);
  return rateLimitExceededResponse(result);
}

/**
 * Full help write abuse sequence: peek completed → rate limit → claim.
 * Returns a response to short-circuit, or null to proceed into the handler.
 */
export async function enforceHelpAbuseGuards(
  request: Request,
  ctx: TenantContext,
  endpoint: string,
  routeKey: string
): Promise<NextResponse | null> {
  const peek = await peekCompletedLiteIdempotency(request, ctx, routeKey);
  if (!peek.ok) return peek.response;

  const rate = await enforceHelpRateLimit(request, ctx, endpoint);
  if (rate) return rate;

  const claim = await claimLiteIdempotencyStrict(request, ctx, routeKey);
  if (!claim.ok) return claim.response;

  return null;
}

/** @deprecated Use enforceHelpAbuseGuards (peek → rate → claim). */
export async function enforceHelpLiteIdempotency(
  request: Request,
  ctx: TenantContext,
  routeKey: string
): Promise<NextResponse | null> {
  const claim = await claimLiteIdempotencyStrict(request, ctx, routeKey);
  if (!claim.ok) return claim.response;
  return null;
}

export async function commitHelpLiteIdempotency(
  request: Request,
  ctx: TenantContext,
  routeKey: string,
  body: unknown,
  statusCode: number
): Promise<NextResponse | null> {
  const result = await storeLiteIdempotency(request, ctx, routeKey, body, statusCode);
  if (!result.ok) return result.response;
  return null;
}

export async function abortHelpLiteIdempotency(request: Request): Promise<NextResponse | null> {
  const result = await releaseLiteIdempotency(request);
  if (!result.ok) return result.response;
  return null;
}

export async function readJsonBodyBounded(
  request: Request
): Promise<{ ok: true; value: unknown } | { ok: false; response: NextResponse }> {
  const tooLarge = rejectIfBodyTooLarge(request);
  if (tooLarge) return { ok: false, response: tooLarge };

  let text: string;
  try {
    text = await request.text();
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid body", code: "invalid_json" }, { status: 400 }),
    };
  }
  if (text.length > HELP_MAX_BODY_BYTES) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Payload too large", code: "payload_too_large" },
        { status: 413 }
      ),
    };
  }
  if (!text.trim()) {
    return { ok: true, value: {} };
  }
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid JSON", code: "invalid_json" }, { status: 400 }),
    };
  }
}

export function clampString(value: unknown, max: number): string | null {
  if (value == null) return null;
  if (typeof value !== "string") return null;
  return value.length > max ? value.slice(0, max) : value;
}

export function sanitizePayload(
  raw: unknown
):
  | { ok: true; value: Record<string, string | number | boolean | null> }
  | { ok: false; response: NextResponse } {
  if (raw == null) return { ok: true, value: {} };
  if (typeof raw !== "object" || Array.isArray(raw)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid payload", code: "invalid_payload" }, { status: 400 }),
    };
  }
  const entries = Object.entries(raw as Record<string, unknown>);
  if (entries.length > HELP_MAX_PAYLOAD_KEYS) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Payload has too many keys", code: "payload_too_large" },
        { status: 413 }
      ),
    };
  }
  const out: Record<string, string | number | boolean | null> = {};
  for (const [k, v] of entries) {
    if (k.length > HELP_MAX_PAYLOAD_STRING_LEN) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Payload key too long", code: "payload_too_large" },
          { status: 413 }
        ),
      };
    }
    if (v === null || typeof v === "boolean" || typeof v === "number") {
      out[k] = v as string | number | boolean | null;
      continue;
    }
    if (typeof v === "string") {
      if (v.length > HELP_MAX_PAYLOAD_STRING_LEN) {
        return {
          ok: false,
          response: NextResponse.json(
            { error: "Payload value too long", code: "payload_too_large" },
            { status: 413 }
          ),
        };
      }
      out[k] = v;
      continue;
    }
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid payload value", code: "invalid_payload" }, { status: 400 }),
    };
  }
  return { ok: true, value: out };
}
