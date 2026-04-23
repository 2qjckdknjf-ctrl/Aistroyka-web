# Wave 4 Step 7 — RLS validation report

**Date:** 2026-03-29

## Commands

| Command | Result |
|---------|--------|
| `npm install` (repo root) | Required so workspace `@aistroyka/contracts` resolves for Vitest |
| `npm run build:contracts:npm` | Optional; ensures `packages/contracts` dist exists before tests |
| `npm run test` (via root `package.json` → `apps/web`) | **PASS** — 195 files, 1172 tests |
| `npm run build` (repo root) | **PASS** |

Running `vitest` only inside `apps/web` without a root workspace install can fail with `Cannot find package '@aistroyka/contracts'`.

## Focused tests

- `lib/tenant/rls-stakeholder-predicates.test.ts` — role intent vs SQL helpers  
- `lib/tenant/tenant.policy.test.ts` — stakeholder RBAC  
- `lib/tenant/stakeholder-dashboard-paths.test.ts` — route redirects  

## Database

- **Local/CI:** migrations are **not** auto-applied in Vitest; **apply** `20260330170000`, `20260330180000`, `20260330190000` (and prerequisites) in each environment.

## Focused checks (post-deploy)

1. Stakeholder session: `GET /api/v1/projects/[id]/client-view` **200** when portal enabled.  
2. Same session: internal-only API (e.g. project intelligence) **403** as before.  
3. SQL (optional): `select * from jobs` as stakeholder JWT → **0 rows** for other tenants’ jobs.
