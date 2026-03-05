/**
 * Provider-level errors for router handling (retryable vs non-retryable).
 * Never log secrets.
 */

export class ProviderUnavailableError extends Error {
  constructor(
    message: string = "Provider unavailable",
    public readonly code?: "missing_key" | "config_disabled"
  ) {
    super(message);
    this.name = "ProviderUnavailableError";
  }
}

export type ProviderErrorCode =
  | "timeout"
  | "rate_limit"
  | "auth"
  | "invalid_input"
  | "server_error"
  | "unknown";

export class ProviderRequestError extends Error {
  constructor(
    message: string,
    public readonly code: ProviderErrorCode = "unknown",
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = "ProviderRequestError";
  }
}

/** True if the router should try the next provider. */
export function isRetryableProviderError(err: unknown): boolean {
  if (err instanceof ProviderUnavailableError) return false;
  if (err instanceof ProviderRequestError) {
    if (err.code === "invalid_input" || err.code === "auth") return false;
    return true; // timeout, rate_limit, server_error → retry with fallback
  }
  return true; // unknown errors: allow fallback
}
