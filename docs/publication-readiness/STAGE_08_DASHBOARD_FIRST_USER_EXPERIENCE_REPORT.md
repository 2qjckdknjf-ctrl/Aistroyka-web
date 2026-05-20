# STAGE 08 — Dashboard UX / First User Experience Report

## 1. Goal

Improve first-user clarity in the dashboard with minimal, production-safe UX changes (no broad redesign).

## 2. Files inspected

- `apps/web/app/[locale]/(dashboard)/dashboard/page.tsx`
- `apps/web/app/[locale]/(dashboard)/dashboard/projects/page.tsx`
- `apps/web/app/[locale]/(dashboard)/dashboard/projects/DashboardProjectsListClient.tsx`
- `apps/web/app/[locale]/(dashboard)/dashboard/tasks/DashboardTasksClient.tsx`
- `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/DashboardProjectDetailClient.tsx`
- `apps/web/app/[locale]/(dashboard)/team/page.tsx`
- `apps/web/components/ui/EmptyState.tsx`

## 3. Findings

1. Dashboard already contains onboarding blocks, but several empty states lacked direct next-action CTAs.
2. Tasks UI contained non-localized hardcoded action labels (`Assign`) inside dashboard tables.
3. Projects surface had list/filters but first-use guidance and creation CTA visibility could be stronger.

## 4. Changes made

1. Improved task empty-state actionability:
   - Added explicit CTA button to open task creation modal in `DashboardTasksClient` empty state.
2. Removed non-localized action labels:
   - Replaced hardcoded `Assign` labels with localized `dashboardDetail.assign`.
3. Improved projects first-use guidance:
   - Added guidance card with direct create-project CTA to dashboard projects page.
   - Added create CTA to projects empty state when there are no projects.

## 5. Validation commands

```bash
cd apps/web
bunx tsc --noEmit
bun run lint
```

## 6. Validation result

- Typecheck: PASSED.
- Lint: PASSED (no ESLint warnings or errors).

## 7. Remaining gaps

1. Full visual/browser walkthrough for all dashboard subroutes is still pending.
2. Runtime UX validation for all empty/loading/error states in live data conditions remains pending.

## 8. Blockers

- None for repository-side UX improvements in this stage.

## 9. Commit hash

Pending (generated after commit).

## 10. Push status

Pending (will push immediately after stage commit).

## 11. Stage verdict

CLOSED

