/**
 * Pure query-error → UI message mapping (no JSX).
 * Used by QueryBoundary and unit-tested without loading React components.
 */

import { getEngineError } from "@/lib/engine/normalizeError";
import type { EngineError } from "@/lib/engine/errors";

export function mapQueryErrorToUI(error: unknown): {
  message: string;
  engineError: EngineError | null;
} {
  const engineError = getEngineError(error);
  if (engineError) return { message: engineError.message, engineError };
  if (error instanceof Error) return { message: error.message, engineError: null };
  return {
    message: typeof error === "string" ? error : "Something went wrong.",
    engineError: null,
  };
}
