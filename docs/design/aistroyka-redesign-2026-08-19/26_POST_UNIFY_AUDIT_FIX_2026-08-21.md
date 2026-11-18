# Post-unify audit fix — 2026-08-21

**Branch:** `design/post-unify-audit-fix`  
**Canon:** Memory OS `56263de1` / unify PR #226

## Bugs fixed

### P0
- **AI Copilot unreachable:** Command Center `tab=ai` only showed jobs table. Restored `AiActionPanel` + `ProjectVideoDailyAnalysisPanel` above jobs.
- **E2E `ai-smoke`:** Targets `/dashboard/projects/:id?tab=ai`.
- **Legacy `/projects/[id]`:** Redirects to `?tab=intelligence` (not sparse overview).
- **Create project:** Navigates to `/dashboard/projects/:id`; new-project back link → `/dashboard/projects`.

### P1
- **iOS list chrome:** Removed incorrect `listRowBackground` on List containers; apply UIKit appearance + `aistroykaListRowSurface` for rows.
- **Android API 26:** `windowLightNavigationBar` moved to full `values-v27` themes (base `values` without that attr).
- **Opaque glass interiors:** LaunchConfidenceBanner + DemoProjectCard use `surface-glass-muted`.
- **Landmine:** Deleted duplicate `stakeholder-dashboard-paths (1).ts` (+ test).

## Validation

```bash
bun run --cwd apps/web check:design
bun run --cwd apps/web lint
bunx tsc --noEmit -p apps/web
bun run --cwd apps/web test -- --run lib/tenant/stakeholder-dashboard-paths.test.ts
```
