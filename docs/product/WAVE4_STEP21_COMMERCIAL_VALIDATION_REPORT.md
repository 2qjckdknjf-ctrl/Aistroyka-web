# Wave 4 Step 21 — Validation report (Stages F–G)

## Automated tests

| Area | File |
|------|------|
| Status transitions + overdue helper | `lib/domain/commercial/commercial.service.test.ts`, `commercial.overdue` via service test |
| API list + POST 400 | `app/api/v1/projects/[id]/commercial-items/route.test.ts` |
| Portfolio review pack | `portfolio-review-pack.service.test.ts` (mocked `countTenantCommercialOverdue`) |

## Commands run

```bash
cd apps/web && npm test -- --run commercial
cd apps/web && npm test -- --run
cd /path/to/AISTROYKA && npm run build
```

## Results

- **Commercial-focused tests:** pass.  
- **Full `apps/web` Vitest:** 219 files, 1245 tests — pass.  
- **Production build (`npm run build` from repo root):** pass (Next.js compile, lint, typecheck, static generation).

## Gaps (honest)

- **P1:** No dedicated tests for `PATCH .../commercial-items/:itemId` route (service covered by transitions).  
- **P2:** No Playwright flow for Commercial tab.
