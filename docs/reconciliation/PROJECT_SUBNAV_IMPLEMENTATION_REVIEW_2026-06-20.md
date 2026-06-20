# Project Subnav Implementation Review — 2026-06-20

## Answers
- Component location is appropriate: YES, under `apps/web/components/projects/`.
- Rendered only inside project detail: YES, wired only into `DashboardProjectDetailClient`.
- No broad dashboard shell churn: YES, `DashboardShell` untouched.
- No external branch code ported blindly: YES.
- Uses existing styling patterns: YES, existing token classes and dashboard surface styling.
- Uses existing route/tab patterns: YES, same `/dashboard/projects/[id]?tab=...` model.
- No unsafe nav items: YES.

## Finding / Fix
- Finding: Overview active state originally matched any non-subnav active tab, including hidden/internal tabs such as `costs` and `ai`.
- Fix: extracted `isProjectSubnavItemActive` and made Overview active only for default `workers` tab.
- Test added for hidden/internal active tabs.

## Verdict
- Implementation is appropriate after active-state hardening.
