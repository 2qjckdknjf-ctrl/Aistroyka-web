# Public Site Design Audit

Base: PR #109 HEAD `bc23c832ad03d7662c0a5db5a00a16c558712de6`

## Current Public Site State

Current public site is routed and visible. The home route uses `PublicHomeContent`, localized metadata, and existing AISTROYKA dark theme tokens.

Current public header has:

- visible wordmark/icon logo
- primary navigation
- desktop Dashboard/Cabinet link
- desktop login link
- mobile Cabinet CTA outside the burger menu
- mobile menu login and Cabinet links

This is an important baseline behavior and must not regress.

## Public Route / Page Coverage

The current public app includes many routed pages under `apps/web/app/[locale]/(public)/**`, including home, features, pricing, enterprise, solutions, workflows, security, mobile, copilot, API, docs, cases, about, contact, and FAQ.

The design branches add stronger visual section components for several pages, but they also touch layout, tokens, public helper libraries, messages, and in some branches AI/runtime code.

## Brand / Logo Consistency

Current implementation uses `Logo` with:

- `/brand/aistroyka-logo.png`
- `/brand/aistroyka-icon.png`
- `/brand/wordmark/aistroyka-wordmark.png`

SVG brand assets also exist:

- `public/brand/aistroyka-logo.svg`
- `public/brand/aistroyka-icon.svg`
- `public/brand/logo/aistroyka-logo-full.svg`

No asset replacement was done in this audit. Future design work should first inventory PNG/SVG usage and avoid breaking metadata, icons, and header dimensions.

## Localization Risks

Design branches modify `apps/web/messages/{en,ru,es,it}.json`. Any future public visual slice with copy changes must update all locale bundles and run `bun run i18n:check`.

## Liquid Glass Differences

Liquid Glass branches introduce:

- reusable public page heroes and CTA sections
- ambient fields and glass surfaces
- new Liquid Glass components and CSS
- richer per-page visual components
- stronger public marketing/SEO helper tests

These are valuable references, but not safe for wholesale merge.

## Safe Public Visual Changes

Potential safe future slice after PR #109 merge:

- one public landing/home hero visual section refresh
- no routing change
- no auth change
- no dashboard import
- no AI/admin route
- no customer/owner finance copy
- no design-token global rewrite beyond a tiny reviewed addition
- all locale bundles updated together

## Public Site Verdict

Public site visual slice safe after PR #109 merge: PARTIAL.

Safe only as a small manually extracted slice with i18n, accessibility, responsive, and navigation tests preserved.
