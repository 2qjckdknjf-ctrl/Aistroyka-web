# Wave 4 Step 20 — Validation report (Stage F–G)

## Automated tests (governance-focused)

| Area | File | Coverage |
|------|------|----------|
| Transitions & gate | `lib/domain/governance/governance.service.test.ts` | `canTransition`, `requireInternalWorkspace` |
| API route wiring | `app/api/v1/governance/cases/route.test.ts` | GET/POST with mocked service |
| Workload priority | `lib/domain/workload/workload.governance.test.ts` | Manager signal priority (includes governance path) |

## Broader regression

- **`apps/web` full Vitest:** `217` files, `1241` tests — **all passed** (run after TableCell `colSpan` fix).
- **Production build:** `npm run build` from repo root — **succeeded** (Next.js compile, lint, typecheck, static generation).

## Tenant / leakage

- Service tests and policy gate cover **portal vs internal** distinction at the service layer.
- Repository queries scope by `tenant_id`; create/update validates project membership in tenant.

## Gaps (honest)

- **No Playwright/E2E** dedicated to governance pages in this step (P2 follow-up if desired).
- **PATCH `[id]` route** has no dedicated route test file yet (covered indirectly via service; P2 to add).

## Commands run (reference)

```bash
cd apps/web && npm test -- --run governance
cd apps/web && npm test -- --run
cd /path/to/AISTROYKA && npm run build
```
