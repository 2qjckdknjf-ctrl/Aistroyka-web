# STAGE 05 — Auth / Tenant / Role / Route Security Report

## 1. Goal

Confirm baseline protection for auth, tenant/project boundaries, and role-scoped API surfaces.

## 2. Files inspected

- `apps/web/middleware.ts`
- `apps/web/lib/api/lite-allow-list.ts`
- `apps/web/lib/tenant/tenant.guard.test.ts`
- representative API tests:
  - `apps/web/app/api/v1/projects/[id]/costs/route.test.ts`
  - `apps/web/app/api/v1/portal/projects/route.test.ts`
  - `apps/web/app/api/v1/portal/projects/[id]/route.test.ts`
  - `apps/web/app/api/v1/projects/[id]/client-view/route.test.ts`

## 3. Findings

1. Middleware enforces authenticated access for protected dashboard/public cabinet prefixes and redirects unauthenticated users to locale login.
2. `/api/v1/owner` surfaces are explicitly gated through owner-specific middleware gate path.
3. Lite mobile clients are restricted to allow-listed `/api/v1/*` routes and receive `403` for disallowed surfaces.
4. Focused route tests cover tenant boundary cases for costs/client/portal APIs.
5. Security headers are centrally applied in middleware.

## 4. Changes made

- No code changes required in this stage after audit.
- Produced evidence report for publication-readiness track.

## 5. Validation commands

```bash
bun run --cwd apps/web test lib/tenant/tenant.guard.test.ts "app/api/v1/projects/[id]/costs/route.test.ts" "app/api/v1/portal/projects/[id]/route.test.ts" "app/api/v1/portal/projects/route.test.ts" "app/api/v1/projects/[id]/client-view/route.test.ts"
```

## 6. Validation result

- Passed (`15/15` tests).
- No immediate auth/tenant regression detected in sampled critical routes.

## 7. Remaining gaps

1. Full route-by-route authorization audit across all `/api/v1/*` endpoints is not yet complete.
2. Runtime verification with real cross-tenant identities in deployed environment remains pending.

## 8. Blockers

- None for repository-local checks.

## 9. Commit hash

Pending (generated after commit in this stage).

## 10. Push status

Pending (will push immediately after stage commit).

## 11. Stage verdict

PARTIAL

