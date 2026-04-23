# Wave 4 Step 9 — Validation inventory (Stage A)

## A1 — Step 9 code paths

| Area | Path |
|------|------|
| Read model / shaping | `apps/web/lib/domain/projects/stakeholder-activity-timeline.repository.ts` |
| Types | `apps/web/lib/domain/projects/stakeholder-activity-timeline.types.ts` |
| Unit tests (shaping) | `apps/web/lib/domain/projects/stakeholder-activity-timeline.repository.test.ts` |
| API | `apps/web/app/api/v1/projects/[id]/stakeholder-activity/route.ts` |
| API tests | `apps/web/app/api/v1/projects/[id]/stakeholder-activity/route.test.ts` |
| Event source (dependency) | `apps/web/lib/domain/client-requests/client-requests.repository.ts` — **`listEventsForProject`** (required for timeline; added during validation closure) |
| Client portal UI | `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/client/ClientPortalActivitySection.tsx`, `ClientPortalViewClient.tsx` |
| Shared block | `apps/web/components/projects/StakeholderActivityBlock.tsx` |
| Manager Activity tab | `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/DashboardProjectDetailClient.tsx` |
| Owner view (if used) | `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/OwnerViewClient.tsx` — stakeholder activity + operations |

## A2 — Test targets (focused)

- `lib/domain/projects/stakeholder-activity-timeline.repository.test.ts`
- `app/api/v1/projects/[id]/stakeholder-activity/route.test.ts`

## A3 — Broader suite

- Full `apps/web` Vitest: `npm test` (from `apps/web`)

## A4 — Build target

- Repository root: `npm run build` (contracts + `apps/web` Next production build)
