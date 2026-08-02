/**
 * Idempotency enforcement for field-worker mobile clients
 * (ios_lite, android_lite, ios_worker, android_worker) write requests.
 *
 * Modes:
 * - legacy (default): get-then-store; fail-open when admin/ctx missing (existing worker routes)
 * - strict: fail-closed unavailable without admin/ctx; atomic INSERT claim + expired reclaim;
 *   finalize/release are error-aware (tri-state). Concurrent same-key cannot both proceed.
 */

import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  claimIdempotencySlotStrict,
  finalizeIdempotencySlot,
  getCachedResponse,
  IDEMPOTENCY_HEADER,
  IDEMPOTENCY_PENDING_STATUS,
  lookupCachedResponse,
  releaseIdempotencySlot,
  storeResponse,
} from "@/lib/platform/idempotency/idempotency.service";
import type { TenantContextOrAbsent } from "@/lib/tenant/tenant.types";

function isLiteClient(header: string | null | undefined): boolean {
  const v = header?.toLowerCase().trim();
  return v === "ios_lite" || v === "android_lite" || v === "ios_worker" || v === "android_worker";
}

export const IDEMPOTENCY_KEY_REQUIRED_CODE = "idempotency_key_required";
export const IDEMPOTENCY_KEY_INVALID_CODE = "idempotency_key_invalid";
export const IDEMPOTENCY_UNAVAILABLE_CODE = "idempotency_unavailable";
export const IDEMPOTENCY_IN_FLIGHT_CODE = "idempotency_in_flight";
export const IDEMPOTENCY_FINALIZE_FAILED_CODE = "idempotency_finalize_failed";
export const IDEMPOTENCY_RELEASE_FAILED_CODE = "idempotency_release_failed";

export const MAX_IDEMPOTENCY_KEY_LENGTH = 128;

export type LiteIdempotencyMode = "legacy" | "strict";

export type LiteIdempotencyOptions = {
  mode?: LiteIdempotencyMode;
};

export type LiteStoreResult =
  | { ok: true }
  | { ok: false; response: NextResponse };

function unavailableResponse(message = "Idempotency store unavailable"): NextResponse {
  return NextResponse.json(
    { error: message, code: IDEMPOTENCY_UNAVAILABLE_CODE },
    { status: 503 }
  );
}

function validateIdempotencyKey(
  raw: string | null
): { ok: true; key: string } | { ok: false; response: NextResponse } {
  if (raw == null || !raw.trim()) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "x-idempotency-key is required for lite clients", code: IDEMPOTENCY_KEY_REQUIRED_CODE },
        { status: 400 }
      ),
    };
  }
  const key = raw.trim();
  if (key.length > MAX_IDEMPOTENCY_KEY_LENGTH) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "x-idempotency-key too long", code: IDEMPOTENCY_KEY_INVALID_CODE },
        { status: 400 }
      ),
    };
  }
  // Printable non-space; reject control chars / blank-only already handled.
  if (!/^[\x21-\x7E]+$/.test(key)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "x-idempotency-key has invalid characters", code: IDEMPOTENCY_KEY_INVALID_CODE },
        { status: 400 }
      ),
    };
  }
  return { ok: true, key };
}

/**
 * Scope client key into PK storage to avoid cross-tenant/user/route collisions
 * (table PK is `key` alone).
 */
export function scopedIdempotencyStorageKey(
  clientKey: string,
  tenantId: string,
  userId: string,
  routeKey: string
): string {
  return `v1:${tenantId}:${userId}:${routeKey}:${clientKey}`;
}

function isCompletedCache(cached: { response: unknown; statusCode: number }): boolean {
  return (
    cached.statusCode >= 200 &&
    cached.statusCode < 300 &&
    cached.statusCode !== IDEMPOTENCY_PENDING_STATUS &&
    cached.response != null
  );
}

type PendingClaim = {
  storageKey: string;
  tenantId: string;
  userId: string;
  routeKey: string;
  mode: LiteIdempotencyMode;
  claimToken: string;
};

const pendingClaims = new WeakMap<Request, PendingClaim>();

/**
 * Peek completed cache for strict lite clients BEFORE rate limiting.
 * - Completed replay → return cached response (no rate charge, no claim).
 * - Miss / expired / pending → proceed (caller must rate-limit then claim).
 * - DB error → 503 (never treat as in-flight or miss).
 * Non-lite → proceed.
 */
export async function peekCompletedLiteIdempotency(
  request: Request,
  ctx: TenantContextOrAbsent,
  routeKey: string
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const client = request.headers.get("x-client")?.toLowerCase().trim();
  if (!isLiteClient(client)) return { ok: true };

  const validated = validateIdempotencyKey(request.headers.get(IDEMPOTENCY_HEADER));
  if (!validated.ok) return validated;

  if (!ctx.tenantId || !ctx.userId) {
    return { ok: false, response: unavailableResponse("Tenant context required for idempotency") };
  }

  const admin = getAdminClient();
  if (!admin) {
    return { ok: false, response: unavailableResponse() };
  }

  const storageKey = scopedIdempotencyStorageKey(validated.key, ctx.tenantId, ctx.userId, routeKey);
  const lookup = await lookupCachedResponse(admin, storageKey, ctx.tenantId, ctx.userId, routeKey);

  switch (lookup.kind) {
    case "error":
      return { ok: false, response: unavailableResponse() };
    case "miss":
    case "expired":
      return { ok: true };
    case "hit": {
      if (isCompletedCache({ response: lookup.response, statusCode: lookup.status_code })) {
        return {
          ok: false,
          response: NextResponse.json(lookup.response, { status: lookup.status_code }),
        };
      }
      // Pending or incomplete — proceed to rate-limit + claim.
      return { ok: true };
    }
    default: {
      const _exhaustive: never = lookup;
      return _exhaustive;
    }
  }
}

/**
 * If request is from a lite client, require x-idempotency-key and optionally return cached response.
 * Returns { ok: true } to proceed, or { ok: false, response } to return immediately.
 *
 * Prefer splitting peek → rate-limit → claim for help routes (see peekCompletedLiteIdempotency).
 * Prefer `mode: "strict"` for state-changing routes that need concurrent duplicate protection.
 */
export async function requireLiteIdempotency(
  request: Request,
  ctx: TenantContextOrAbsent,
  routeKey: string,
  options?: LiteIdempotencyOptions
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const mode = options?.mode ?? "legacy";
  const client = request.headers.get("x-client")?.toLowerCase().trim();
  if (!isLiteClient(client)) return { ok: true };

  const validated = validateIdempotencyKey(request.headers.get(IDEMPOTENCY_HEADER));
  if (!validated.ok) return validated;

  if (!ctx.tenantId || !ctx.userId) {
    if (mode === "strict") {
      return { ok: false, response: unavailableResponse("Tenant context required for idempotency") };
    }
    return { ok: true };
  }

  const admin = getAdminClient();
  if (!admin) {
    // Fail closed for all lite/worker writes: never allow untracked mutations.
    return { ok: false, response: unavailableResponse() };
  }

  const storageKey =
    mode === "strict"
      ? scopedIdempotencyStorageKey(validated.key, ctx.tenantId, ctx.userId, routeKey)
      : validated.key;

  if (mode === "strict") {
    const claim = await claimIdempotencySlotStrict(
      admin,
      storageKey,
      ctx.tenantId,
      ctx.userId,
      routeKey
    );
    switch (claim.kind) {
      case "error":
        return { ok: false, response: unavailableResponse() };
      case "completed":
        return {
          ok: false,
          response: NextResponse.json(claim.response, { status: claim.statusCode }),
        };
      case "in_flight":
        return {
          ok: false,
          response: NextResponse.json(
            { error: "Idempotent request already in flight", code: IDEMPOTENCY_IN_FLIGHT_CODE },
            { status: 409, headers: { "Retry-After": "1" } }
          ),
        };
      case "claimed":
        pendingClaims.set(request, {
          storageKey,
          tenantId: ctx.tenantId,
          userId: ctx.userId,
          routeKey,
          mode: "strict",
          claimToken: claim.claimToken,
        });
        return { ok: true };
      default: {
        const _exhaustive: never = claim;
        return _exhaustive;
      }
    }
  }

  const cached = await getCachedResponse(admin, storageKey, ctx.tenantId, ctx.userId, routeKey);
  if (cached && isCompletedCache(cached)) {
    return {
      ok: false,
      response: NextResponse.json(cached.response, { status: cached.statusCode }),
    };
  }

  return { ok: true };
}

/**
 * Strict claim only (after peek + rate limit). Non-lite → ok.
 * When peek already saw completed, caller should not reach here.
 */
export async function claimLiteIdempotencyStrict(
  request: Request,
  ctx: TenantContextOrAbsent,
  routeKey: string
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  return requireLiteIdempotency(request, ctx, routeKey, { mode: "strict" });
}

/**
 * Store response for lite client idempotency. Call after successful handler execution only.
 * Does not cache 4xx/5xx. In strict mode finalizes the atomic claim.
 * Strict finalize failure → ok:false with 503 (does not release — avoids double side effect).
 */
export async function storeLiteIdempotency(
  request: Request,
  ctx: TenantContextOrAbsent,
  routeKey: string,
  responseBody: unknown,
  statusCode: number
): Promise<LiteStoreResult> {
  if (statusCode < 200 || statusCode >= 300) {
    return releaseLiteIdempotency(request);
  }

  const client = request.headers.get("x-client")?.toLowerCase().trim();
  if (!isLiteClient(client)) return { ok: true };

  const pending = pendingClaims.get(request);
  const admin = getAdminClient();
  if (!admin) {
    if (pending?.mode === "strict") {
      return { ok: false, response: unavailableResponse() };
    }
    return { ok: true };
  }

  if (pending?.mode === "strict") {
    const finalized = await finalizeIdempotencySlot(
      admin,
      pending.storageKey,
      pending.tenantId,
      pending.userId,
      pending.routeKey,
      responseBody,
      statusCode,
      pending.claimToken
    );
    if (!finalized.ok) {
      // Leave pending claim so retries cannot double-apply side effects.
      return {
        ok: false,
        response: NextResponse.json(
          {
            error: "Idempotency finalize failed after side effect",
            code: IDEMPOTENCY_FINALIZE_FAILED_CODE,
          },
          { status: 503 }
        ),
      };
    }
    pendingClaims.delete(request);
    return { ok: true };
  }

  const key = request.headers.get(IDEMPOTENCY_HEADER)?.trim();
  if (!key || !ctx.tenantId || !ctx.userId) return { ok: true };

  const stored = await storeResponse(admin, key, ctx.tenantId, ctx.userId, routeKey, responseBody, statusCode);
  if (!stored) {
    return { ok: false, response: unavailableResponse("Idempotency store write failed") };
  }
  return { ok: true };
}

/** Release a strict pending claim after handler failure (allows retry). */
export async function releaseLiteIdempotency(request: Request): Promise<LiteStoreResult> {
  const pending = pendingClaims.get(request);
  if (!pending || pending.mode !== "strict") return { ok: true };
  const admin = getAdminClient();
  if (!admin) {
    pendingClaims.delete(request);
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Idempotency release unavailable", code: IDEMPOTENCY_RELEASE_FAILED_CODE },
        { status: 503 }
      ),
    };
  }
  const released = await releaseIdempotencySlot(
    admin,
    pending.storageKey,
    pending.tenantId,
    pending.userId,
    pending.routeKey,
    pending.claimToken
  );
  pendingClaims.delete(request);
  if (!released.ok) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Idempotency release failed", code: IDEMPOTENCY_RELEASE_FAILED_CODE },
        { status: 503 }
      ),
    };
  }
  return { ok: true };
}

export { isLiteClient, validateIdempotencyKey };
