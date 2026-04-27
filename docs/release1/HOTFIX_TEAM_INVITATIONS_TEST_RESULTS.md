# HOTFIX — Team / Invitations — Test results

## Commands run

```bash
cd apps/web && npx vitest run \
  lib/tenant/invitation-errors.test.ts \
  app/api/tenant/invite/route.test.ts \
  app/api/tenant/accept-invite/route.test.ts
```

## Targeted tests

| Suite | Result |
|-------|--------|
| `lib/tenant/invitation-errors.test.ts` | PASS (3) |
| `app/api/tenant/invite/route.test.ts` | PASS (2) |
| `app/api/tenant/accept-invite/route.test.ts` | PASS (1) |

**Total:** 6 tests, all passed.

## Coverage intent

- **Schema missing / schema cache:** Mapped to HTTP 503 and human-readable copy (regression guard for PostgREST cache errors).
- **Invite success path:** Insert → select → single returns accept_link (mocked Supabase chain).
- **Accept path:** Error branch when invitation select fails with missing table (503).

## Full suite

```bash
cd /Users/alex/Projects/AISTROYKA && npm run test
```

**Result:** 182 test files, **1112 tests passed** (includes targeted files above).

## Production smoke

- **`/api/v1/ops/metrics` = 200** requires a user with tenant context (see `getTenantContextFromRequest`). After migrations are applied, **invite accept** or **first-time tenant bootstrap** (`getOrCreateTenantForCurrentUser`) establishes membership.
- Smoke credentials must correspond to a user that has completed signup/bootstrap or accepted an invite; the missing `tenant_invitations` table did not cause 403 by itself—orphan users without `tenant_members` / owner row still return 403 until membership exists.

## Remaining gaps

- None in-repo for this contour after migration apply. **Operator action:** apply migration to the linked Supabase project.
