# Design Safe Next Slice Plan

Base: PR #109 HEAD `bc23c832ad03d7662c0a5db5a00a16c558712de6`

## Recommended Next Small PR

After PR #109 merges and `main` validation passes, the next safest design work is:

**Public landing/home hero visual polish using existing public routing and existing brand assets.**

This should be a tiny manually extracted slice, not a Liquid Glass branch merge.

## Proposed Scope

Safe candidate:

- update only one public surface, preferably home hero or a single reusable public visual component
- preserve current public header navigation and mobile Cabinet CTA
- preserve existing routes
- preserve dashboard/auth code
- preserve current brand asset paths unless a separate asset review approves changes
- update all locale bundles together if copy changes

## Likely Files If Approved Later

Possible future slice files:

- `apps/web/app/[locale]/(public)/PublicHomeContent.tsx`
- one new `apps/web/components/public/*` component
- `apps/web/messages/{en,ru,es,it}.json` only if copy changes
- one focused test under `apps/web/lib/design` or public route helper if a helper is added

Avoid in the first design slice:

- `DashboardShell`
- project detail/dashboard components
- owner/customer portal panels
- global CSS/token rewrites
- Liquid Glass full component kit
- admin AI pages
- routing/layout/middleware

## Required Tests

- `bun run i18n:check`
- full web test suite
- `bun run build`
- `bun run cf:build`
- public header/Cabinet visibility smoke
- accessibility check for focus and reduced motion if animation is introduced

## What Must Remain Deferred

- full Liquid Glass shell
- dashboard redesign
- owner/customer portal redesign
- mobile design parity
- AI/admin design surfaces
- global token migration
- logo/favicon/OG asset replacement

## No Broad Merge Rule

Broad Liquid Glass merge safe: NO.

Reasons:

- design branches include AI migrations/routes or mobile/API code
- broad branches alter routing/layout/global CSS
- role-gated dashboard/customer surfaces require separate security review
- locale, accessibility, and responsive regressions would be hard to isolate

## Slice Verdict

Next safe slice: small public home/hero visual polish after PR #109 baseline merge.

Safe before PR #109 merges: NO.
