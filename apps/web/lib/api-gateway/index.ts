/**
 * API gateway foundation — envelope, errors, pagination, auth.
 */

export {
  success,
  apiError,
  isApiError,
  errorToStatus,
  type ApiEnvelope,
  type ApiEnvelopeSuccess,
  type ApiEnvelopeError,
} from "./api-response";
export {
  parseCursorPagination,
  parseOffsetPagination,
  normalizeLimit,
  normalizeOffset,
  DEFAULT_PAGE_LIMIT,
  MAX_PAGE_LIMIT,
  type CursorPaginationParams,
  type CursorPaginationMeta,
  type OffsetPaginationParams,
} from "./pagination";
export {
  requireApiAuth,
  getOptionalApiAuth,
  type ApiAuthResult,
} from "./auth";
