# Phase 4 — Construction intelligence validation

**Date:** 2026-03-23  
**Issue:** [AISAA-12](/AISAA/issues/AISAA-12)

## Automated tests (executed)

Command (from `apps/web`):

```bash
npx vitest run \
  lib/domain/projects/project-attention.repository.test.ts \
  lib/domain/projects/project-timeline.repository.test.ts \
  lib/domain/projects/project-status.service.test.ts \
  lib/portfolio/portfolio-summary-shape.test.ts
```

**Result:** 4 files, **25 tests passed** (2026-03-23).

## Tests not run in this closure (gap)

- No dedicated **route-level** integration tests were added for `GET /api/v1/portfolio/summary` or `GET /api/v1/projects/:id/{summary,attention,timeline}` in this pass (existing coverage is primarily domain/unit).
- Full `npm run test` / CI was not re-run for scope control; recommend CI on merge.

## Manual scenarios (executive / manager)

Run in an environment where **auth, tenant, and DB migrations** match repo (staging after [AISAA-11](/AISAA/issues/AISAA-11) remediation).

| # | Scenario | Pass criteria |
|---|----------|----------------|
| M1 | Open **portfolio** command view | Loads without error; shows project rows, distribution, optional risks/actions |
| M2 | Open **project** as manager | Summary shows status/health badges; attention block lists document/issue-driven items when data exists |
| M3 | **Timeline** tab/block | Events ordered; empty state acceptable on new project |
| M4 | Open **owner** project view | `viewer=owner` attention path works only for owner role; 403 otherwise |
| M5 | Drill-down from portfolio recommendation | `getResourceHref` resolves known `relatedResourceType` values to in-app routes |

## Production note

Until `GET /api/v1/health` is **200** with consistent RLS (see [PHASE3_REMEDIATION.md](./PHASE3_REMEDIATION.md)), treat **live** validation as **blocked** for any flow that depends on stable anon/tenant DB behavior — even if authenticated project pages work in isolation.
