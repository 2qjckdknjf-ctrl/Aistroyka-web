# Auth / RBAC / System Route Review

Base: PR #109 HEAD `bc23c832ad03d7662c0a5db5a00a16c558712de6`

## Current Auth / RBAC Shape

Tenant role helpers distinguish tenant owner/admin/member/viewer/stakeholder style roles in several layers:

- tenant context resolution
- `tenant.policy.ts`
- `auth/tenant.ts`
- project membership helpers
- route-specific guards

PR #109 adds an important lesson: broad tenant `member` permissions are not sufficient for report review. Report review now requires tenant owner/admin or explicit server-side project manager membership.

## Tenant / Project Boundaries

Current high-risk boundaries:

- tenant owner/admin vs generic member
- project manager vs project worker/internal member
- stakeholder/customer/owner portal role boundaries
- lite worker client surface area
- platform owner cabinet vs tenant owner

Future security work must avoid treating client headers or UI visibility as authorization.

## System Routes

Current system routes:

- `/api/v1/system/health`
- `/api/v1/system/metrics`

They use `requireSystemRouteAuth`, which:

- requires `SYSTEM_API_KEY` in production
- requires `X-System-Key` when key is set
- returns 503 in production if no key is configured
- allows unauthenticated non-production access only when no key is set

Existing tests cover production/no-key, missing header, wrong header, matching key, and `NEXT_PUBLIC_APP_ENV=production`.

## Platform Owner Routes

Owner routes use middleware and handler-level platform-owner gates. The owner middleware includes:

- optional allowed-host check
- optional IP allow-list check
- owner surface cookie for pages
- optional owner secret header for API routes
- session requirement
- session freshness evaluation
- platform-owner grant lookup
- owner role method gating
- rate limiting
- denial logging/security alerts

This layer is separate from tenant owner/admin and must remain separate.

## Report Review / Export Lessons From PR #109

Confirmed good patterns:

- report export backend enforces owner/admin and denies lite worker clients
- report review denies lite worker clients and then checks server-side project manager role where tenant role is only member
- audit logs are written only after successful report review
- UI role gates are not trusted as backend authorization

Remaining security follow-ups should reuse this principle: server-side role/membership checks, not client headers.

## Risks Requiring Tests

- legacy auth callback or tenant member route changes from stale branches
- system route behavior under Cloudflare production envs
- owner API double rate-limit marker behavior
- API security headers on actual route responses
- lite allow-list route additions
- customer/owner portal finance boundaries

## Verdict

Auth/RBAC broad changes safe now: NO.

System route changes safe now: PARTIAL.

Future changes must be route-scoped with focused tests.
