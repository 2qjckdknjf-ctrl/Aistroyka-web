# LG-4X Final Polish Audit

**Date:** 2026-06-18  
**Branch:** `design/liquid-glass-public-shell-lg2a` (uncommitted LG-4X delta on top of `94eb5ded`)  
**Scope:** All in-scope public marketing routes + global shell (header, footer, metadata, structured data, i18n)

## Clean room (step 0)

At LG-4X kickoff after PRE-LG45 commit `94eb5ded`: **clean working tree confirmed**.  
During LG-4X: **expected dirty tree** (audit fixes in progress; no commit per instruction).

## Routes audited

| Route | Breadcrumb JSON-LD | Metadata helper | CTA → Contact | Related depth |
| --- | --- | --- | --- | --- |
| `/` | ✅ single-item Home | ✅ | ✅ home CTAs | ✅ |
| `/platform` | ✅ | ✅ | ✅ | via sections |
| `/features` | ✅ | ✅ | ✅ | via sections |
| `/solutions` | ✅ | ✅ | ✅ | ✅ related links |
| `/mobile` | ✅ | ✅ | ✅ | ✅ related links |
| `/copilot` | ✅ | ✅ | ✅ | ✅ related links |
| `/ai-construction-control` | ✅ | ✅ | ✅ | via sections |
| `/ai-demo` | ✅ | ✅ | ✅ | via hero links |
| `/pricing` | ✅ | ✅ | ✅ | via sections |
| `/enterprise` | ✅ | ✅ | ✅ | via sections |
| `/integrations` | ✅ | ✅ | ✅ | via sections |
| `/security` | ✅ | ✅ | ✅ | ✅ related links |
| `/implementation` | ✅ | ✅ | ✅ | via sections |
| `/faq` | ✅ | ✅ | ✅ | ✅ related links |
| `/about` | ✅ | ✅ | ✅ | ✅ related links |
| `/contact` | ✅ | ✅ | ✅ (primary) | via sections |
| `/api` | ✅ | ✅ | ✅ | CTA-only (acceptable) |
| `/workflows` | ✅ | ✅ | ✅ | CTA-only (acceptable) |
| `/partners` | ✅ | ✅ | ✅ | ✅ related links (new) |

## Fixes applied in LG-4X

### Breadcrumb SEO (step 2)

- Added `apps/web/lib/seo/public-page-breadcrumb.ts` with `buildBreadcrumbListJsonLd` / `buildStandardPublicBreadcrumb`.
- Added `PublicJsonLd` component for page-level JSON-LD injection.
- Wired **BreadcrumbList** on all 19 in-scope routes (home = single-item list; inner = Home → current).
- Added `public.layout.breadcrumbHome` in **en / ru / es / it**.

### Mobile UX (step 3)

- `overflow-x-clip` on public `<main>` to prevent horizontal bleed.
- `PublicRelatedLinksSection`: explicit `grid-cols-1` on narrow viewports.
- `PublicCTASection`: `aria-labelledby` + tighter horizontal padding on small screens.
- `PublicFeatureGrid`: heading association via `aria-labelledby` (not duplicate `aria-label`).
- `PublicPageHero`: default `grid-cols-1`, `max-w-full` on visual column.
- Partners page grids: `min-w-0 grid-cols-1` breakpoints.

### Accessibility (step 4)

- Single `h1` preserved on all audited pages (partners uses centered `h1` + `h2` sections).
- Section headings use semantic `h2`/`h3` via shared public components.
- CTA and feature grids expose labelled headings for screen readers.
- Focus-visible styles inherited from liquid-glass / design-token focus rings (no regressions introduced).

### Truth audit (step 5)

Removed or softened unsupported **real-time / live** claims in public copy (all locales):

| Key area | Change |
| --- | --- |
| `public.home.heroLensLabel` | “Sample site lens” (illustrative hero, not live feed) |
| `public.platform.stepReportsDesc` | “when connected” (not near-real-time) |
| `public.mobile.mgrProjectVisibilityDesc` | reflected when reports sync |
| `public.implementation.stepLiveUsageTitle` | “Active usage” |
| `public.implementation.processSubtitle` | active usage (not “live usage”) |
| `public.projectsShowcase.progressTrackingDesc` | reported progress + photo evidence |

Enterprise SSO, SLA, SOC/ISO remain explicitly **planned / evaluation-scoped** (unchanged honest labels from PRE-LG45).

### Conversion (step 6)

- Every in-scope route terminates in **Contact** via `PublicCTASection` and/or related links including `/contact`.
- Partners page upgraded: metadata helper, related links, conversion CTA block.

### SEO consistency (step 7)

- All audited pages use `buildPublicPageMetadata` (partners migrated in LG-4X).
- Global layout retains Organization + SoftwareApplication + WebSite JSON-LD.
- Sitemap includes all in-scope paths; robots unchanged (canonical production rules).

### i18n (step 8)

- Partners related-link keys added **en / ru / es / it**.
- Truth-copy fixes mirrored across **ru / es / it**.
- `I18N_CHECK_ALL=1 bun run i18n:check` → **PASS**.

## P3 (documented, not blocking)

| ID | Item | Rationale |
| --- | --- | --- |
| P3-NAV | Secondary “More” nav density on tablet | Usable; not broken |
| P3-VIS | No live browser pass at 320–768px in this audit | Code-level mobile guards applied; recommend spot-check in Glass before LG-4.5 |
| P3-API-WF | `/api` and `/workflows` lack related-links section | CTA + footer nav sufficient; optional depth in LG-5 |

## Validation (step 10)

| Command | Result |
| --- | --- |
| `bun run --cwd apps/web check:design` | **PASS** |
| `bun run lint` | **PASS** |
| `bun x tsc --noEmit` (apps/web) | **PASS** |
| `bun run i18n:check` | **PASS** |
| `I18N_CHECK_ALL=1 bun run i18n:check` | **PASS** |
| `bun run build` | **PASS** |
| `bun run cf:build` | **PASS** |
