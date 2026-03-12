/**
 * Centralized error handling: safe logging and consistent responses.
 * Use in API route catch blocks; never leak internal stack to client.
 */

import { logStructured, captureException } from "@/lib/observability";
import type { MappedErrorResponse } from "./error-mapper";
import { mapErrorToResponse } from "./error-mapper";
import { AppError } from "./error.types";

export interface HandleErrorOptions {
  requestId?: string | null;
  route?: string;
  tenantId?: string | null;
  userId?: string | null;
  /** If true, do not log (e.g. expected 4xx). */
  silent?: boolean;
}

/**
 * Log error safely (no stack in production client payload) and return response shape.
 */
export function handleError(error: unknown, options: HandleErrorOptions = {}): MappedErrorResponse {
  const { requestId, route, tenantId, userId, silent } = options;
  const mapped = mapErrorToResponse(error, { requestId });

  if (!silent) {
    const message = error instanceof Error ? error.message : String(error);
    const name = error instanceof Error ? error.name : "Error";
    logStructured({
      event: "error_handled",
      error_name: name,
      error_message: message.length > 500 ? message.slice(0, 500) + "…" : message,
      status_code: mapped.statusCode,
      request_id: requestId ?? undefined,
      route,
      tenant_id: tenantId ?? undefined,
      user_id: userId ?? undefined,
    });
    if (mapped.statusCode >= 500) {
      captureException(error, {
        request_id: requestId ?? undefined,
        route,
        tenant_id: tenantId ?? undefined,
        user_id: userId ?? undefined,
        category: "api_5xx",
        severity: "error",
      });
    }
  }

  return mapped;
}

/**
 * Check if error is our AppError (for optional branching).
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof Error && error.name === "AppError" && "code" in error && "statusCode" in error;
}
