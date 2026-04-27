# Wave 4 Step 13 — Final validation inventory

## Touched Step 13 areas (code paths)

| Area | Location | Validation method |
|------|----------|-------------------|
| Defect domain | `apps/web/lib/domain/defects/*` | Unit: `defects.service.test.ts` |
| Handover + defects | `apps/web/lib/domain/project-handover/handover-readiness.ts` | Unit: `handover-readiness.test.ts` |
| Defects API | `apps/web/app/api/v1/projects/[id]/defects/route.ts` | Route: `defects/route.test.ts` |
| Manager UI | `DashboardProjectDetailClient.tsx` (Punch list tab), `DefectsProjectTab.tsx`, `.../defects/[defectId]/` | Build + manual / env smoke after deploy |
| Stakeholder UI | `.../client/defects/*`, `ClientPortalViewClient.tsx` | Build |
| Migration | `apps/web/supabase/migrations/20260404120000_project_defects.sql` | DB apply + SQL verification |

## Test targets (minimum)

- `lib/domain/defects/defects.service.test.ts`
- `lib/domain/project-handover/handover-readiness.test.ts`
- `app/api/v1/projects/[id]/defects/route.test.ts`

## Broader web scope

- Full `apps/web` Vitest suite: `npx vitest run --maxWorkers=1` (204 files, all Step 13-adjacent routes included).

## Rollout target

- **Schema**: `public.project_defects`, `public.project_defect_events` via `20260404120000_project_defects.sql`.
- **Established apply path**: GitHub Actions **Apply Supabase migrations** (`workflow_dispatch`, staging/production), `working-directory: apps/web`, `supabase db push --include-all` after `supabase link` (see `.github/workflows/apply-migrations.yml`).
- **Alternative**: `cd apps/web && SUPABASE_DB_URL='postgresql://…' npm run db:migrate` (see `scripts/run-migrations.mjs`).

## Rollout proof required for hard closure

1. Migration applied on the target Supabase project(s).  
2. Post-apply SQL or API checks proving tables/policies exist (see post-apply report template).
