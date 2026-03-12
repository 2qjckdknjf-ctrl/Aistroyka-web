/**
 * API gateway — response envelope and error mapping.
 * Use for v1 routes; keeps responses consistent.
 */

export interface ApiEnvelopeSuccess<T> {
  data: T;
  meta?: {
    requestId?: string;
    at?: string;
  };
}

export interface ApiEnvelopeError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    requestId?: string;
    at?: string;
  };
}

export type ApiEnvelope<T> = ApiEnvelopeSuccess<T> | ApiEnvelopeError;

export function isApiError(envelope: ApiEnvelope<unknown>): envelope is ApiEnvelopeError {
  return "error" in envelope && typeof (envelope as ApiEnvelopeError).error === "object";
}

/** Build success envelope. */
export function success<T>(data: T, meta?: ApiEnvelopeSuccess<T>["meta"]): ApiEnvelopeSuccess<T> {
  return { data, meta };
}

/** Build error envelope. */
export function apiError(
  code: string,
  message: string,
  meta?: ApiEnvelopeError["meta"],
  details?: Record<string, unknown>
): ApiEnvelopeError {
  return {
    error: { code, message, details },
    meta,
  };
}

/** Map domain/validation errors to HTTP status. */
export function errorToStatus(code: string): number {
  switch (code) {
    case "unauthorized":
    case "auth_required":
      return 401;
    case "forbidden":
    case "insufficient_rights":
      return 403;
    case "not_found":
      return 404;
    case "conflict":
    case "replay":
      return 409;
    case "validation_error":
    case "bad_request":
      return 400;
    case "rate_limited":
      return 429;
    default:
      return 500;
  }
}
