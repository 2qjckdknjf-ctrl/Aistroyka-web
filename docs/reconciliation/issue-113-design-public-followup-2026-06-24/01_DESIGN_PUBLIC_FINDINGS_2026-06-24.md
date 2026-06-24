# Issue #113 Design/Public Follow-Up — Findings

**Date:** 2026-06-24  
**Baseline `main`:** `0d26254bd59282c337b49063db028ff50a2d1e1e`

| Area | Status | Evidence | Risk | Recommendation |
|------|--------|----------|------|----------------|
| **Public homepage / shell** | PASS (functional) | `apps/web/app/[locale]/(public)/page.tsx`, `PublicHomeContent.tsx`, `(public)/layout.tsx`; header/footer via `PublicHeader` / `PublicFooter` | P1 visual/copy drift vs product truth | Keep shell; no Liquid Glass swap |
| **Public header / Cabinet CTA** | PASS | `PublicHeader.tsx`: desktop + mobile `/dashboard` Cabinet CTA outside burger; login link; sticky header | Low | Do not regress Cabinet visibility |
| **Primary CTA / copy** | PARTIAL | Hero + header + final CTA use `public.nav.requestDemo` → **"Request Demo"** (EN); links to `/contact`. User/product preference: **Launch pilot**, **Contact us**, **Get presentation** | P1 stale demo-first messaging | Safe next slice: i18n CTA truth cleanup |
| **Secondary CTA** | PASS | Hero secondary → `/ai-demo` via `public.nav.aiDemo` ("AI Demo") | Low | Keep; page is explicitly a mock AI demo |
| **Homepage mock metrics** | PARTIAL | `PublicHomeContent.tsx` hardcodes `MOCK_METRICS` (`500+`, `12K+`, etc.) with marketing labels | P1 unsupported social-proof numbers | Defer to separate slice: remove or replace with non-numeric copy |
| **Trust strip copy** | PARTIAL | `public.home.trustStrip`: "Trusted by construction and development teams" — generic, no named customers | P2 | Soften or qualify in a later copy slice; not blocking |
| **i18n consistency (public CTAs)** | PARTIAL | `requestDemo` / `ctaDemo` / `finalCtaButton` / `bookDemo` use demo wording in EN/RU/ES/IT (`Запросить демо`, `Solicitar demo`, etc.) | P1 | Align all four locale files together |
| **Production GA claims** | PASS | No "GA", "production ready", or "certified" in `public.*` message keys on `main` | Low | Do not add GA claims in design work |
| **Architecture 9.5/10 claim** | PASS | Not present in public UI copy; rejected in truth index (PR #124) | Low | Forbidden in public surfaces |
| **Liquid Glass on `main`** | N/A (not present) | No `liquid-glass` imports/components/styles on `main`; only safe tokens: `public-shell`, `public-badge`, `public-card-motion` in `apps/web/app/globals.css`; neural blur tokens in `design-tokens.css` | Low | Do not broad-import LG kit from stale branches |
| **Liquid Glass branches** | DO NOT MERGE | `design/liquid-glass-public-shell-lg2a` @ `68be705a` still on remote (PR #108); includes LG components, AI routes, migrations per prior audits | P0 if broad-merged | Reference only; extract zero wholesale |
| **Other design branches** | DO NOT MERGE | `feature/unified-product-design-certification` (721 files); `design/mobile-liquid-glass` forbidden per operator rules | P0 | No broad merge |
| **Stacked audit branch** | DO NOT MERGE to `main` as-is | `audit/issue-113-design-public-stacked-audit-2026-06-22` @ `6ece0d5d` — docs-only but stale base | Low | Use as evidence; this follow-up supersedes for current SHA |
| **Public route coverage** | PASS | 20+ public routes under `(public)/` (home, pricing, enterprise, contact, faq, etc.) | Low | No route changes in next slice |
| **Brand assets** | PASS | `Logo` uses `/brand/aistroyka-logo.png`, icon, wordmark; JSON-LD in public layout | Low | No asset swap in next slice |
| **Public copy tests** | PARTIAL | `cabinet-dashboard-routing.policy.test.ts` covers Cabinet CTA in header; no test asserts demo CTA strings | P2 | Optional follow-up: i18n key presence test |
| **Visual regression risk** | LOW for copy slice | i18n-only CTA change does not alter layout/CSS | Low | Prefer copy-only over CSS/LG |
| **Deployment truth** | NOT VERIFIED | Truth index: latest main deployment not assumed without buildStamp | — | No deploy claim from this audit |

## Summary counts

- **P0:** none on current `main` runtime (P0 risk is **broad merge** of Liquid Glass / certification branches)
- **P1:** stale demo-first public CTAs; hardcoded mock homepage metrics; i18n demo wording across locales
- **P2:** generic trust strip; limited public CTA test coverage
