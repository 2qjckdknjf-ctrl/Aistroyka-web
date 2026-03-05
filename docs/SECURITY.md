# Security stance (Phase 4.8)

## Request size limits

- **Media uploads:** `POST /api/projects/[id]/upload` and media-related payloads are limited to **25MB** (body and file size). Larger requests receive `413 Request Entity Too Large`.

## Auth and login

- **Rate limiting:** `/api/auth/login` is rate-limited per IP via the platform rate-limit service.
- **Audit:** Login outcomes are logged via structured logging (no secrets). Tenant-scoped `audit_logs` require tenant context and are not used for pre-auth login events.

## Job processing

- **Protection:** `POST /api/v1/jobs/process` requires tenant context, membership, and scope `jobs:process` (owner or admin). Rate-limited per tenant/IP. No anonymous or member-only access.

## Debug and diag endpoints

- In **production**, debug/diag routes (`/api/_debug/*`, `/api/diag/*`) are disabled unless:
  1. The corresponding `DEBUG_*` env var is set (e.g. `DEBUG_AUTH=true`, `DEBUG_DIAG=true`), and
  2. The request `Host` header is in the comma-separated `ALLOW_DEBUG_HOSTS` list.
- Otherwise they return `404 Not available`.

## CSRF

- **Stance:** Same-site cookies are used for session; ensure cookies use `SameSite=Lax` or `Strict` where set. For state-changing operations that might be called from cross-origin, use tokens (e.g. idempotency key or CSRF token) in addition to auth; idempotency keys are required on write endpoints for mobile.

## Security headers

- Applied globally via `next.config.js` headers:
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `X-Frame-Options: DENY`
  - `Permissions-Policy` restricting camera, microphone, geolocation, interest-cohort.
