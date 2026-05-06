# Localization Visual Audit

## Scope

- Locale-aware public and dashboard routes (`ru/en/es/it`)
- Header/nav labels and CTA blocks
- Auth entry pages
- Shell resilience under longer text strings

## Findings

## Locale infrastructure

- Locale routing and navigation wrappers are in place (`next-intl`, locale-aware `Link` usage).
- Updated public branding uses locale-safe logo component and does not depend on textual brand width.

## Public pages

- CTA containers use wrapping and min-width fallbacks.
- Hero and card blocks mostly use `text-balance`/`text-pretty` or flexible width wrappers.
- Remaining risk: medium-breakpoint nav density for languages with longer labels (RU/ES) may still need incremental spacing tuning.

## Dashboard/app shell

- Sidebar links are vertically stacked and resilient to moderate label growth.
- Topbar has wrap behavior and truncation for long user email.

## Auth/onboarding

- Login/register cards are width constrained and visually stable.
- Register now mirrors login logo treatment, improving brand consistency across locales.

## Fixes Applied for Localization Resilience

- Public header switched from text-only brand to image-based wordmark/icon by breakpoint, reducing text overflow pressure.
- Public CTA blocks were normalized to shared button primitives with wrapping behavior.

## Not Changed (Intentional)

- No translation content rewrite was performed.
- No route logic or locale fallback logic was changed.

## Validation Notes

- Build/test/lint validation completed successfully for web.
- Full per-locale screenshot sweep (RU/EN/ES/IT across all pages) is still recommended as follow-up visual QA.

## Verdict

- Localization visual baseline is stable for core shells and major CTA blocks.
- Remaining risk is concentrated in dense nav/intelligence surfaces with long translated labels.
