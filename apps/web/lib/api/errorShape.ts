/**
 * Standard error shape for API/RPC responses consumed by the UI.
 * All API wrappers and UI should use this shape for errors.
 */

export interface ApiErrorBody {
  code: string;
  message: string;
  context?: unknown;
}

export interface ApiErrorResponse {
  ok: false;
  error: ApiErrorBody;
}

export function normalizeApiError(
  res: Response,
  data: { success?: boolean; error?: string; [k: string]: unknown }
): ApiErrorResponse {
  const message =
    typeof data?.error === "string"
      ? data.error
      : res.status === 401
        ? "Unauthorized"
        : res.status === 404
          ? "Not found"
          : res.status === 429
            ? "Rate limit exceeded. Try again in a minute."
            : res.status === 503
              ? "Service unavailable. Check configuration."
              : res.status >= 500
                ? "Server error. Please try again."
                : "Request failed.";
  const code =
    res.status === 401
      ? "UNAUTHORIZED"
      : res.status === 404
        ? "NOT_FOUND"
        : res.status === 429
          ? "RATE_LIMIT_EXCEEDED"
          : res.status === 503
            ? "SERVICE_UNAVAILABLE"
            : res.status >= 500
              ? "SERVER_ERROR"
              : "BAD_REQUEST";
  return {
    ok: false,
    error: { code, message, context: data },
  };
}

/** Normalize fetch failure (network error) to standard shape. */
export function networkErrorToApiError(): ApiErrorResponse {
  return {
    ok: false,
    error: {
      code: "NETWORK_ERROR",
      message: "Network error. Please try again.",
    },
  };
}
