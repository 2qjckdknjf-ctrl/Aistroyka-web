# P1 Request-Bound Supabase Client Closure Report

Date: 2026-04-25

## Scope

Closed the second concrete P1 blocker from `PRODUCTION_RUNTIME_TRUTH_AUDIT.md`: worker/mobile critical v1 routes derived tenant context from the incoming `Request`, but then used the cookie-only Supabase client for user-scoped DB reads.

This was not a broader auth refactor. No DB schema, mobile app, response shape, tenant policy, RLS, or service-role behavior was changed.

## Files Inspected

- `apps/web/lib/supabase/server.ts`
- `apps/web/lib/tenant/tenant.context.ts`
- `apps/web/lib/tenant/tenant.policy.ts`
- `apps/web/lib/tenant/tenant.guard.ts`
- `apps/web/app/api/v1/sync/bootstrap/route.ts`
- `apps/web/app/api/v1/projects/[id]/uploads/route.ts`
- `apps/web/app/api/v1/config/route.ts`
- existing route tests using `createClientFromRequest`

## Helper Findings

- Bearer-aware helper: `createClientFromRequest(request)` in `apps/web/lib/supabase/server.ts`.
  - Reads `Authorization: Bearer <token>`.
  - Rejects `service_role` JWTs.
  - Falls back to `createClient()` when no Bearer token is present, preserving browser cookie sessions.
- Cookie-only helper: `createClient()` in `apps/web/lib/supabase/server.ts`.
  - Reads Supabase session from Next cookies.
- Tenant context helper: `getTenantContextFromRequest(request)` already uses `createClientFromRequest(request)`.
- Tenant guard: `requireTenant(ctx)` only asserts tenant presence and does not create clients.

## Already Request-Bound Examples

Representative v1 routes/tests already following the request-bound pattern included:

- `apps/web/app/api/v1/media/upload-sessions/route.ts`
- `apps/web/app/api/v1/media/upload-sessions/[id]/finalize/route.ts`
- `apps/web/app/api/v1/projects/[id]/client-requests/route.ts`
- `apps/web/app/api/v1/projects/[id]/client-portal/route.ts`
- `apps/web/app/api/v1/projects/[id]/client-view/route.ts`
- `apps/web/app/api/v1/projects/[id]/defects/route.ts`
- `apps/web/app/api/v1/projects/[id]/service-requests/route.ts`

## Inconsistent Routes Found

The following critical routes derived tenant context from `request` and then switched to cookie-only `createClient()` for downstream DB/config reads:

- `apps/web/app/api/v1/sync/bootstrap/route.ts`
- `apps/web/app/api/v1/projects/[id]/uploads/route.ts`
- `apps/web/app/api/v1/config/route.ts`

Additional manager/admin-style routes with a similar pattern were observed, such as worker summary/day and some project/tenant management routes. They were not changed in this P1 closure because the requested scope was worker/mobile critical runtime routes, starting with the three audited suspicious routes.

## Files Changed

- `apps/web/app/api/v1/sync/bootstrap/route.ts`
  - Replaced cookie-only `createClient()` with `createClientFromRequest(request)`.
  - Preserves `x-device-id`, tenant requirement, response validation, logging, and response shape.
- `apps/web/app/api/v1/projects/[id]/uploads/route.ts`
  - Replaced cookie-only `createClient()` with `createClientFromRequest(request)`.
  - Preserves tenant requirement, project access check, pagination, and response shape.
- `apps/web/app/api/v1/config/route.ts`
  - Replaced cookie-only `createClient()` with `createClientFromRequest(request)`.
  - Preserves unauthenticated config behavior because the helper falls back to cookies/no session as before.
- `apps/web/app/api/v1/sync/bootstrap/route.test.ts`
  - Added focused tests for Bearer path, cookie/fallback path, and missing-auth rejection.
- `apps/web/app/api/v1/config/route.test.ts`
  - Added focused tests for Bearer path and unauthenticated/cookie fallback path.
- `apps/web/lib/runtime/request-bound-project-uploads-route.test.ts`
  - Added focused tests for Bearer path, cookie/fallback path, missing-auth rejection, and project access denial.
  - Kept outside an `uploads/` directory so it is tracked by Git.

## Why The Changes Are Safe

- `createClientFromRequest(request)` is the existing canonical helper for API routes that need Bearer support.
- Cookie auth remains supported through the helper fallback to `createClient()`.
- No route response shapes were changed.
- Tenant checks still run before protected DB reads in sync bootstrap and project uploads.
- RLS remains user-scoped through the Supabase anon client with the user's Bearer token or cookie session.
- No service-role access was introduced.
- Project upload cross-tenant/project denial remains enforced by the existing `getProject` access path before listing uploads.

## Validation Commands

- `git status --short --branch --untracked-files=all`
  - Passed; changed files are limited to the three scoped routes, three focused tests, and this report.
- `bun run --cwd apps/web test "app/api/v1/sync/bootstrap/route.test.ts" "lib/runtime/request-bound-project-uploads-route.test.ts" "app/api/v1/config/route.test.ts"`
  - Passed: 3 files, 9 tests.
- `bun run test`
  - Passed: 231 files, 1285 tests.
- `bun run cf:build`
  - Passed: Next.js build, OpenNext Cloudflare build, and post-build patches completed.
- `bash scripts/release/check-migrations.sh`
  - Passed: 96 migrations.
- `ReadLints`
  - Passed: no linter errors reported for touched files.

## Remaining Risks

- This closure does not audit or change every v1 route that uses `getTenantContextFromRequest(request)` followed by `createClient()`. Some manager/admin/browser-oriented routes still use that pattern and may need a separate scoped pass if Bearer support is later required for them.
- Tests mock Supabase clients and verify the route wiring to request-bound clients. They do not execute against a live Supabase project with real JWTs and RLS policies.

## Final Verdict

P1 request-bound Supabase client consistency: CLOSED.

The critical worker/mobile routes identified by the audit now use request-bound Supabase clients for downstream DB/config reads. Cookie auth is preserved by the existing helper fallback, Bearer auth is supported, tenant checks are not weakened, and validation is green.
