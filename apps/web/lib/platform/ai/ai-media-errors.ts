/**
 * Stable AI media / provider error codes for jobs, admin diagnostics, and safe UI mapping.
 * Never put secrets, stack traces, or full provider payloads in user-facing messages.
 */

export const AI_ERROR_CODES = {
  AI_MEDIA_NOT_READY: "AI_MEDIA_NOT_READY",
  AI_MEDIA_NOT_FOUND: "AI_MEDIA_NOT_FOUND",
  AI_MEDIA_ACCESS_DENIED: "AI_MEDIA_ACCESS_DENIED",
  AI_MEDIA_OBJECT_MISSING: "AI_MEDIA_OBJECT_MISSING",
  AI_MEDIA_CORRUPT_REFERENCE: "AI_MEDIA_CORRUPT_REFERENCE",
  AI_MEDIA_STORAGE_TEMPORARY: "AI_MEDIA_STORAGE_TEMPORARY",
  AI_PROVIDER_NOT_CONFIGURED: "AI_PROVIDER_NOT_CONFIGURED",
  AI_PROVIDER_TEMPORARILY_UNAVAILABLE: "AI_PROVIDER_TEMPORARILY_UNAVAILABLE",
  AI_PROVIDER_AUTH_ERROR: "AI_PROVIDER_AUTH_ERROR",
  AI_PROVIDER_RATE_LIMIT: "AI_PROVIDER_RATE_LIMIT",
  AI_PROVIDER_TIMEOUT: "AI_PROVIDER_TIMEOUT",
  AI_PROVIDER_INVALID_RESPONSE: "AI_PROVIDER_INVALID_RESPONSE",
  AI_PROVIDER_FAILED: "AI_PROVIDER_FAILED",
  AI_PROVIDERS_EXHAUSTED: "AI_PROVIDERS_EXHAUSTED",
  AI_POLICY_BLOCKED: "AI_POLICY_BLOCKED",
} as const;

export type AIErrorCode = (typeof AI_ERROR_CODES)[keyof typeof AI_ERROR_CODES];

/** Codes that should retry with backoff (temporary). */
export function isRetryableAIErrorCode(code: string): boolean {
  switch (code) {
    case AI_ERROR_CODES.AI_MEDIA_NOT_READY:
    case AI_ERROR_CODES.AI_MEDIA_STORAGE_TEMPORARY:
    case AI_ERROR_CODES.AI_PROVIDER_TEMPORARILY_UNAVAILABLE:
    case AI_ERROR_CODES.AI_PROVIDER_RATE_LIMIT:
    case AI_ERROR_CODES.AI_PROVIDER_TIMEOUT:
    case AI_ERROR_CODES.AI_PROVIDERS_EXHAUSTED:
      return true;
    case AI_ERROR_CODES.AI_MEDIA_NOT_FOUND:
    case AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED:
    case AI_ERROR_CODES.AI_MEDIA_OBJECT_MISSING:
    case AI_ERROR_CODES.AI_MEDIA_CORRUPT_REFERENCE:
    case AI_ERROR_CODES.AI_PROVIDER_NOT_CONFIGURED:
    case AI_ERROR_CODES.AI_PROVIDER_AUTH_ERROR:
    case AI_ERROR_CODES.AI_PROVIDER_INVALID_RESPONSE:
    case AI_ERROR_CODES.AI_PROVIDER_FAILED:
    case AI_ERROR_CODES.AI_POLICY_BLOCKED:
      return false;
    default:
      return false;
  }
}

/** Safe user-facing message keys under dashboardDetail.* (not raw technical text). */
export type AIUserMessageKey =
  | "aiStatusQueued"
  | "aiStatusRunning"
  | "aiStatusSuccess"
  | "aiStatusTemporary"
  | "aiStatusFailed"
  | "aiStatusNotConfigured"
  | "aiStatusEmpty"
  | "aiStatusFilteredEmpty";

export function userMessageKeyForAIErrorCode(
  code: string | null | undefined,
): AIUserMessageKey {
  if (!code) return "aiStatusFailed";
  switch (code) {
    case AI_ERROR_CODES.AI_MEDIA_NOT_READY:
    case AI_ERROR_CODES.AI_MEDIA_STORAGE_TEMPORARY:
    case AI_ERROR_CODES.AI_PROVIDER_TEMPORARILY_UNAVAILABLE:
    case AI_ERROR_CODES.AI_PROVIDER_RATE_LIMIT:
    case AI_ERROR_CODES.AI_PROVIDER_TIMEOUT:
    case AI_ERROR_CODES.AI_PROVIDERS_EXHAUSTED:
      return "aiStatusTemporary";
    case AI_ERROR_CODES.AI_PROVIDER_NOT_CONFIGURED:
      return "aiStatusNotConfigured";
    default:
      return "aiStatusFailed";
  }
}

/** Strip secrets / stack / internal paths from error text before returning to tenants. */
export function sanitizeAIErrorForTenant(
  message: string | null | undefined,
): string | null {
  if (!message) return null;
  let out = message;
  // Redact obvious secrets
  out = out.replace(/sk-[a-zA-Z0-9_-]{10,}/g, "[redacted]");
  out = out.replace(/Bearer\s+[A-Za-z0-9._\-]+/gi, "Bearer [redacted]");
  out = out.replace(
    /supabase\.co\/storage\/v1\/object\/[^\s"']+/gi,
    "[storage]",
  );
  out = out.replace(/\/storage\/v1\/object\/[^\s"']+/gi, "[storage]");
  // Drop stack-like lines
  out = out
    .split("\n")
    .filter((line) => !/^\s*at\s+/.test(line) && !/node_modules/.test(line))
    .join(" ")
    .trim();
  if (out.length > 240) out = `${out.slice(0, 237)}…`;
  return out || null;
}
