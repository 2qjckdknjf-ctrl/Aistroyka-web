# API Gateway Foundation

## Overview

Foundation for **versioned API (v1)** responses and auth: **response envelope**, **error mapping**, **pagination pattern**, and **API auth abstraction**. It does not replace existing routes; it provides shared helpers so new or refactored routes can use a consistent pattern.

## Structure

| File | Role |
|------|------|
| `lib/api-gateway/api-response.ts` | `ApiEnvelopeSuccess`, `ApiEnvelopeError`, `success()`, `apiError()`, `errorToStatus()` |
| `lib/api-gateway/pagination.ts` | `parseCursorPagination`, `parseOffsetPagination`, `normalizeLimit`, `normalizeOffset`, `DEFAULT_PAGE_LIMIT`, `MAX_PAGE_LIMIT` |
| `lib/api-gateway/auth.ts` | `requireApiAuth(request)` → `ApiAuthResult`, `getOptionalApiAuth(request)` |
| `app/api/v1/users/route.ts` | **Scaffold route:** GET uses envelope + requireApiAuth + offset pagination; returns `{ data: { users: [], meta } }` |

## Response envelope

- **Success:** `{ data: T, meta?: { requestId?, at? } }`.
- **Error:** `{ error: { code, message, details? }, meta? }`.
- Use `success(data, meta)` and `apiError(code, message, meta, details)`; map codes to status with `errorToStatus(code)`.

## Pagination

- **Offset:** `parseOffsetPagination(request)` → `{ offset, limit }` (normalized; limit capped at 100).
- **Cursor:** `parseCursorPagination(request)` → `{ cursor, limit }`.
- No response envelope field for pagination yet; routes can add `data.meta.nextCursor` / `hasMore` as needed.

## Auth

- **requireApiAuth(request):** Uses existing `getTenantContextFromRequest` + `requireTenant`; returns `{ ok: true, tenantId, userId, ctx }` or `{ ok: false, status, body }` for 401.
- **getOptionalApiAuth(request):** Same context without requiring tenant (for public or optional-auth routes).

## What is real vs scaffold

- **Real:** Envelope types and helpers, pagination parsing and limits, auth wrapper around tenant context, error code → status mapping.
- **Scaffold:** Only one route (`GET /api/v1/users`) uses the foundation and returns an empty list; projects, tasks, reports, insights remain on existing handlers. No public API key or rate limiting in this layer.

## Extension points

1. **Migrate routes:** Refactor existing v1 handlers to return `success(data)` and use `requireApiAuth` for consistent errors and status codes.
2. **API keys:** Add a middleware or helper that resolves tenant from API key header when present, and use it alongside or instead of session auth.
3. **Versioning:** Keep v1 as-is; add v2 folder when needed and reuse the same envelope/pagination/auth helpers.
