/**
 * Normalize engine/API errors so React Query sees a stable type (with status for retry policy).
 */

import type { EngineError } from "./errors";

export type QueryError = Error & { status?: number; engineError?: EngineError };

/** Turn EngineError into an Error-like object so queryClient retry (401/403/404) and UI can use it. */
export function normalizeToQueryError(engineError: EngineError): QueryError {
  const err = new Error(engineError.message) as QueryError;
  err.status = engineError.status;
  err.engineError = engineError;
  return err;
}

/** If error has engineError, return it; otherwise return null. */
export function getEngineError(error: unknown): EngineError | null {
  if (error != null && typeof error === "object" && "engineError" in error) {
    const e = (error as QueryError).engineError;
    return e ?? null;
  }
  return null;
}
