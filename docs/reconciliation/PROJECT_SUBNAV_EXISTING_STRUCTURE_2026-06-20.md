# Project Subnav Existing Structure — 2026-06-20

## Project Detail Route
- Route: `/[locale]/dashboard/projects/[id]`
- Page: `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/page.tsx`
- Client: `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/DashboardProjectDetailClient.tsx`

## Existing Structure
- Project detail already uses internal tabs driven by `activeTab` and `?tab=...`.
- Existing tabs include safe and unsafe/internal items:
  - workers
  - contractors
  - reports
  - uploads
  - ai
  - intelligence
  - schedule
  - documents
  - decisions
  - costs
  - estimate

## Existing Subfeature Routes / Panels
- Reports panel exists.
- Documents panel exists.
- Schedule/timeline panel exists.
- Decisions/approvals panel exists.
- Costs and estimate panels exist but are internal finance-adjacent and not part of this slice.
- AI/intelligence panels exist but are not expanded in this slice.

## Access Assumptions
- Project detail route already enforces dashboard/auth/project access through existing page/API flow.
- This slice does not add new access policy.
- The new subnav does not link customer/stakeholder portal routes.

## Existing Tests
- Dashboard shell nav utility test exists.
- No focused project subnav test existed before this slice.

## Files Modified
- `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/DashboardProjectDetailClient.tsx`
- `apps/web/components/projects/ProjectSubnav.tsx`
- `apps/web/components/projects/project-subnav.items.ts`
- `apps/web/components/projects/ProjectSubnav.test.ts`
- `apps/web/messages/{en,ru,es,it}.json`
