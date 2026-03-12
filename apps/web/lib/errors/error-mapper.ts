/**
 * Map errors to HTTP status and safe client payload.
 * No stack traces or internal details in response.
 */

import type { ErrorCode } from "./error.types";

export interface MappedErrorResponse {
  statusCode: number;
  body: { error: string; code?: ErrorCode; request_id?: string };
}

export function mapErrorToResponse(
  error: unknown,
  options?: { requestId?: string | null }
): MappedErrorResponse {
  const requestId = options?.requestId ?? undefined;

  if (error && typeof error === "object" && "statusCode" in error && "publicMessage" in error) {
    const appErr = error as { statusCode: number; publicMessage: string; code?: ErrorCode };
    return {
      statusCode: appErr.statusCode,
      body: {
        error: appErr.publicMessage,
        ...(appErr.code && { code: appErr.code }),
        ...(requestId && { request_id: requestId }),
      },
    };
  }

  const message = error instanceof Error ? error.message : String(error);
  const is4xx =
    message.includes("not found") ||
    message.includes("unauthorized") ||
    message.includes("forbidden") ||
    message.includes("validation");
  const statusCode = is4xx ? 400 : 500;
  const publicMessage =
    statusCode >= 500 ? "Service temporarily unavailable. Please try again." : "Request failed.";

  return {
    statusCode,
    body: {
      error: publicMessage,
      ...(requestId && { request_id: requestId }),
    },
  };
}
