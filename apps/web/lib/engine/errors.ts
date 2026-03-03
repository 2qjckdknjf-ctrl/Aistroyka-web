/**
 * Unified error mapping for AI/engine (Copilot Edge) responses.
 * Supports Retry-After header for countdown UX.
 */

export type EngineErrorKind =
  | "rate_limited"
  | "budget_exceeded"
  | "circuit_open"
  | "timeout"
  | "security_blocked"
  | "unauthorized"
  | "unknown";

export interface EngineError {
  kind: EngineErrorKind;
  status: number;
  requestId: string;
  message: string;
  retryable: boolean;
  /** When present (e.g. from Retry-After header), UI can show countdown. */
  retryAfterSeconds?: number;
}

const DEFAULT_REQUEST_ID = "";

/** Parse Retry-After header: integer seconds or HTTP-date. Returns seconds or undefined. */
export function parseRetryAfterHeader(headers: Headers | null): number | undefined {
  if (!headers) return undefined;
  const raw = headers.get("Retry-After")?.trim();
  if (!raw) return undefined;
  const asNum = parseInt(raw, 10);
  if (!Number.isNaN(asNum) && asNum >= 0) return asNum;
  try {
    const date = new Date(raw);
    if (!Number.isNaN(date.getTime())) {
      const sec = Math.max(0, Math.ceil((date.getTime() - Date.now()) / 1000));
      return sec;
    }
  } catch {
    // ignore
  }
  return undefined;
}

/**
 * Map HTTP status, body, and optional headers to EngineError.
 * Priority for requestId: passed requestId (authoritative from client) > body.request_id.
 * Retry-After header -> retryAfterSeconds. rate_limited/circuit_open/timeout retryable; budget_exceeded/security_blocked not.
 */
export function mapToEngineError(
  status: number,
  body: Record<string, unknown> | null,
  requestId: string | null,
  responseHeaders?: Headers | null
): EngineError {
  const rid = requestId ?? (body?.request_id != null ? String(body.request_id).trim() : null) ?? DEFAULT_REQUEST_ID;
  const fallbackReason = body?.fallback_reason != null ? String(body.fallback_reason) : "";
  const errorCategory = body?.error_category != null ? String(body.error_category) : "";
  const securityBlocked = body?.security_blocked === true;
  const retryAfterSeconds = parseRetryAfterHeader(responseHeaders ?? null);

  if (status === 429) {
    return {
      kind: "rate_limited",
      status: 429,
      requestId: rid,
      message: "Rate limit exceeded. Try again in a minute.",
      retryable: true,
      retryAfterSeconds: retryAfterSeconds ?? 60,
    };
  }

  if (securityBlocked) {
    return {
      kind: "security_blocked",
      status: status || 200,
      requestId: rid,
      message: "Response was blocked by security policy. Please rephrase your request.",
      retryable: false,
    };
  }

  if (status === 401 || status === 403 || errorCategory === "unauthorized") {
    return {
      kind: "unauthorized",
      status: status || 401,
      requestId: rid,
      message: "Unauthorized. Please sign in again.",
      retryable: false,
    };
  }

  if (
    fallbackReason === "tenant_budget_exceeded" ||
    fallbackReason === "user_limit_exceeded" ||
    errorCategory === "budget_exceeded" ||
    errorCategory === "user_limit_exceeded"
  ) {
    return {
      kind: "budget_exceeded",
      status: status || 200,
      requestId: rid,
      message:
        "Token budget exceeded for this period. Contact your administrator or wait for the next period.",
      retryable: false,
    };
  }

  if (errorCategory === "circuit_open" || fallbackReason === "circuit_open") {
    return {
      kind: "circuit_open",
      status: status || 200,
      requestId: rid,
      message: "AI service is temporarily limited. It will auto-recover in about 60 seconds.",
      retryable: true,
    };
  }

  if (errorCategory === "timeout" || fallbackReason === "timeout") {
    return {
      kind: "timeout",
      status: status || 408,
      requestId: rid,
      message: "Request timed out. Try again.",
      retryable: true,
    };
  }

  const unknownMessage =
    typeof body?.message === "string"
      ? body.message
      : typeof body?.error === "string"
        ? body.error
        : status >= 500
          ? "Server error. Please try again."
          : "Something went wrong.";

  return {
    kind: "unknown",
    status,
    requestId: rid,
    message: unknownMessage,
    retryable: status >= 500 || status === 408,
  };
}
