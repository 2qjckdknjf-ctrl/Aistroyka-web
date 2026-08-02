/**
 * Strict anonymous IP rate limit for POST /api/v1/contact.
 *
 * Contract:
 * - Single-key atomic RPC via `checkAndIncrementStrict` / `rate_limit_try_increment`
 * - Key: `ip:<canonicalTrustedIp>:<sanitized /api/v1/contact>`
 * - Limit: 5 requests per UTC minute window
 * - Retry-After: 60 seconds when limited
 * - No email/message/PII in keys or diagnostics
 * - No subscription-plan lookup (anonymous public surface)
 * - Caller must supply a successfully normalized trusted IP from `resolveTrustedClientIp`
 * - Fail closed on RPC error / malformed response (never fail open)
 *
 * Production enablement of the RPC requires migration
 * `20260725190000_rate_limit_try_increment.sql` applied by operators.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  checkAndIncrementStrict,
  rateLimitKey,
} from "@/lib/platform/rate-limit/rate-limit.store";
import type { StrictRateLimitResult } from "@/lib/platform/rate-limit/rate-limit.service";

/** Canonical endpoint identity for contact abuse accounting. */
export const PUBLIC_CONTACT_ENDPOINT = "/api/v1/contact";

/** Conservative per-IP cap within the shared one-minute window. */
export const PUBLIC_CONTACT_IP_LIMIT = 5;

/** Retry-After when the IP bucket is exhausted (seconds). */
export const PUBLIC_CONTACT_RETRY_AFTER_SEC = 60;

/** Max JSON body bytes (declared Content-Length and actual read). */
export const CONTACT_MAX_BODY_BYTES = 16_384;

export const CONTACT_PAYLOAD_TOO_LARGE_CODE = "payload_too_large";

export async function checkPublicContactRateLimit(
  supabase: SupabaseClient,
  trustedIp: string
): Promise<StrictRateLimitResult> {
  const ip = trustedIp.trim();
  if (!ip) {
    return {
      ok: false,
      kind: "unavailable",
      message: "Rate limit service unavailable.",
    };
  }

  const key = rateLimitKey("ip", ip, PUBLIC_CONTACT_ENDPOINT);
  const result = await checkAndIncrementStrict(supabase, key, PUBLIC_CONTACT_IP_LIMIT);
  if (!result.ok) {
    return {
      ok: false,
      kind: "unavailable",
      message: "Rate limit service unavailable.",
    };
  }
  if (!result.allowed) {
    return {
      ok: false,
      kind: "limited",
      message: "Too many requests from this IP.",
      retryAfterSec: PUBLIC_CONTACT_RETRY_AFTER_SEC,
      limit: PUBLIC_CONTACT_IP_LIMIT,
      dimension: "ip",
    };
  }
  return { ok: true };
}
