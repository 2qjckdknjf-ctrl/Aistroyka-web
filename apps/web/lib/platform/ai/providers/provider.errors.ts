/**
 * Provider-level errors for router: retryable vs non-retryable, no secrets in messages.
 */

export class ProviderUnavailableError extends Error {
  constructor(provider: string, reason: string = "provider unavailable") {
    super(`${provider}: ${reason}`);
    this.name = "ProviderUnavailableError";
  }
}

export type ProviderErrorCode =
  | "timeout"
  | "rate_limit"
  | "auth"
  | "client_error"
  | "server_error"
  | "unknown";

export class ProviderError extends Error {
  constructor(
    provider: string,
    code: ProviderErrorCode,
    message: string,
    public readonly retryable: boolean
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

export function isRetryableError(err: unknown): boolean {
  if (err instanceof ProviderError) return err.retryable;
  if (err instanceof ProviderUnavailableError) return false;
  const msg = err instanceof Error ? err.message : String(err);
  if (/timeout|ETIMEDOUT|ECONNRESET/i.test(msg)) return true;
  if (/429|rate limit/i.test(msg)) return true;
  if (/5\d{2}/.test(msg)) return true;
  if (/400|401|403|invalid/i.test(msg)) return false;
  return true;
}
