# Wave 4 Step 14 — Validation report

**Executed:** 2026-03-28 (local)

## Automated tests

| Suite | Result |
|-------|--------|
| `vitest run lib/domain/aftercare/aftercare.service.test.ts` | Pass — resolution note, closure note, invalid coverage, close-from-resolved |
| `vitest run app/api/v1/projects/[id]/service-requests/route.test.ts` | Pass — GET list, POST manager/stakeholder branching |
| `vitest run apps/web` (full) | **1205** tests passed |

## Production build

- `npm run build` from repository root: **success** (Next.js compiled, typecheck, static generation completed, exit code 0).

## Focused areas covered

- Service request create/list policy branching  
- Lifecycle validation in service layer  
- Timeline repository tolerates missing `project_service_requests` table (error → empty)  
- No new linter issues on touched aftercare files (IDE diagnostics)

## Manual / environment

- **Supabase migration** `20260405120000_project_aftercare_service_requests.sql` must be applied in non-local environments for full persistence and RLS behavior.
