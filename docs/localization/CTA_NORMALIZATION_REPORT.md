# CTA normalization report

**Date:** 2026-04-01

## Policy

| Role | Key (`public.nav`) | RU | EN |
|------|---------------------|----|----|
| Primary | `launchPilot` | Запустить пилот | Launch pilot |
| Secondary A | `getPresentation` | Получить презентацию | Get presentation |
| Secondary B | `contactUs` | Связаться с нами | Contact us |

## Replacements performed

| Location | Before | After |
|----------|--------|--------|
| `PublicHeader.tsx` | `requestDemo` | `launchPilot` |
| `PublicHomeContent.tsx` | Hardcoded “Start Project”, “View Demo” | `launchPilot`, `getPresentation`, `ctaLogin` |
| `pricing/page.tsx` | `bookDemo` + `requestQuote` | `launchPilot` + `contactUs` (via `public.nav`) |
| `copilot/page.tsx`, `enterprise/page.tsx` | `ctaDemo` | `launchPilot` via `public.nav` |
| `workflows/page.tsx` | “Request demo” (hardcoded EN) | `launchPilot` |
| `contact/page.tsx` | `demoBlockTitle` + EN paragraph | `secondaryBlockTitle`, `secondaryBlockBody`, `secondaryBlockTagline` |
| Messages (`public.nav`) | `requestDemo` | Removed; added `launchPilot`, `getPresentation`, `contactUs` |
| `public.home` / pricing / faq / aiDemo | “demo” CTAs and meta copy | Pilot / presentation / contact wording |

## Intentionally unchanged (non-marketing)

- **Plan-fit** internal enum value `startMode: "demo"` in `plan-fit-api.schema.ts` — backend taxonomy, not a visible CTA label. UI label should be localized via `planFitOnboarding.startMode_demo` when that namespace is populated.
- **Route** `/ai-demo` — URL kept for bookmarks/SEO; visible labels use “AI analysis” / «ИИ-анализ», not “Demo”.
- **`CopilotSummaryPanel` “demo mode”** — developer/data-empty state naming, not a user-facing marketing button.

## Verification

- Grep for marketing “Request demo” / “Запросить демо” on `(public)` pages: removed from primary flows; remaining “demo” references are code identifiers, internal modes, or the `/ai-demo` path segment.
