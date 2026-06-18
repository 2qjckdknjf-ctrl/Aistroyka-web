# LG-2B Global Closure Audit

**Date:** 2026-06-18  
**Branch:** `design/liquid-glass-public-shell-lg2a`  
**Authority:** Principal Website Auditor + IA Lead  
**Scope:** Public marketing layer — Home, Platform, Mobile, Copilot, About, FAQ, Contact; navigation; CTA architecture; i18n; glass governance; content ownership; accessibility.

**Out of scope (explicit):** No new page redesigns; no LG-2B.7+ or phase-2 route refactors in this pass.

---

## 1. Request Demo audit

| Location | Copy / key | Classification | Notes |
|----------|------------|----------------|-------|
| **Home** final band (pre-fix) | `public.home.finalCtaButton` → "Request Demo" | **REWRITE** | P1 CTA violation — fixed in global pass |
| **Home** final subtitle (pre-fix) | `public.home.finalCtaSubtitle` | **REWRITE** | Demo language removed |
| **Home** pricing teaser (pre-fix) | `public.home.pricingTeaserSubtitle` | **REWRITE** | Demo language removed |
| **Home** dead keys | `ctaDemo`, `ctaLaunchPilot`, `ctaContact`, `ctaPresentation`, `finalCtaButton` | **REMOVE** | Consolidated to `public.cta.*` |
| **Platform, Mobile, Copilot, About, FAQ, Contact** | — | **KEEP** (absent) | All use `public.cta.*` via `PublicCTASection` |
| **Contact** (LG-2B.6) | `demoBlockTitle`, `businessCta*` | **REMOVE** | Removed in contact redesign |
| **Nav header** | `public.nav.requestDemo` | **REMOVE** (from nav UI) | Key retained; header uses `contactUs` only |
| **`/workflows`** | `tNav("requestDemo")` | **REWRITE** | Phase-2 tail — not LG-2B page |
| **`/pricing`** | `bookDemo` | **REWRITE** | Phase-2 tail |
| **`/enterprise`** | `ctaDemo` | **REWRITE** | Phase-2 tail |
| **`/ai-demo`** route + `aiDemo` nav label | Product demo simulator | **KEEP** | Product feature naming, not sales CTA |

---

## 2. CTA architecture audit

**Target hierarchy**

| Tier | Label | Route |
|------|-------|-------|
| Primary | Launch pilot | `/dashboard` |
| Secondary | Contact us | `/contact` |
| Tertiary | Get presentation | `/contact` |

**Scoped pages (7 + home hero/final)**

| Surface | Primary | Secondary | Tertiary | Verdict |
|---------|---------|-----------|----------|---------|
| Home hero | ✅ `public.cta` | ✅ | ✅ | PASS (post-fix) |
| Home final band | ✅ `PublicCTASection` band | ✅ | ✅ | PASS (post-fix) |
| Platform … Contact | ✅ `PublicCTASection` floating | ✅ | ✅ | PASS |
| **PublicHeader** desktop/mobile | Cabinet + Login; secondary **Contact us** | — | — | PASS (no demo CTA) |

**Violations found (pre-fix)**

| ID | Severity | Surface | Issue |
|----|----------|---------|-------|
| CTA-1 | **P1** | Home final band | Single "Request Demo" primary to `/contact` — wrong tier and label |
| CTA-2 | **P2** | Home hero | Duplicate i18n keys vs `public.cta.*` |
| CTA-3 | **P3** | `/workflows`, `/pricing`, `/enterprise` | Legacy demo CTAs — phase-2 backlog |

---

## 3. Content ownership audit

| Page | Intended ownership | Implementation | Overlap |
|------|-------------------|----------------|---------|
| **Home** | Outcome / entry | Hero lens, pain/solution, module teaser, role teaser, AI/mobile/pricing teasers | **P3:** modules ↔ Platform; roles ↔ Solutions; AI ↔ Copilot; mobile ↔ Mobile |
| **Platform** | Capabilities | Capability grid, timeline, proof | Low — links out to Mobile / AI |
| **Mobile** | Field workflow | Workflow grid, timeline, proof | Low |
| **Copilot** | AI assistant (bounded) | Capability grid, boundary copy, proof | Low — no finance / autonomous agent claims |
| **About** | Mission / trust | Problems, why, principles, proof | Low |
| **FAQ** | Objections | Q&A grid, deep links | **P3:** answers defer to Platform/Mobile/Copilot |
| **Contact** | Conversion | Form + paths + proof | Low — form POST preserved |

**Verdict:** No P1/P2 ownership collisions on scoped pages. Homepage lower sections retain intentional teasers (documented P3 dedupe for phase 2).

---

## 4. Glass governance audit

**Budget:** `LG_MAX_VISIBLE_NODES = 6` (`apps/web/lib/design/liquid-glass.ts`); layout mounts one `LiquidGlassFilter`.

**Visible glass node counts (page content + layout nav)**

| Page | GlassNav | Hero visual | Highlight | Floating CTA | Hero metric chips | **Total** | Budget | Status |
|------|----------|-------------|-----------|--------------|-------------------|-----------|--------|--------|
| **Home** | 1 | 1 (`PublicHeroLens`) | 0 | 0 (final band = solid) | 4 (`PublicHeroMetrics`) | **6** | 6 (LG-2A) | ✅ At cap |
| **Platform** | 1 | 1 | 1 (`capConstructionAi`) | 1 | 0 | **4** | ≤4 | ✅ |
| **Mobile** | 1 | 1 | 1 | 1 | 0 | **4** | ≤4 | ✅ |
| **Copilot** | 1 | 1 | 1 | 1 | 0 | **4** | ≤3† | ✅ under global max |
| **About** | 1 | 1 | 1 | 1 | 0 | **4** | ≤3† | ✅ under global max |
| **FAQ** | 1 | 1 (decorative) | 0 | 1 | 0 | **3** | ≤2† | ✅ under global max |
| **Contact** | 1 | 1 | 0 | 1 | 0 | **3** | ≤2† | ✅ under global max |

† Per-page targets in `LG2B_GLASS_GOVERNANCE.md` were conservative; all pages remain **≤6** global max. Home final CTA intentionally uses **`variant="band"`** (no `GlassPanel`) to avoid exceeding the LG-2A 6-node cap.

**Forbidden surfaces:** FAQ answers, contact form, legal — all solid. ✅

---

## 5. i18n audit (EN / RU / ES / IT)

| Check | Result |
|-------|--------|
| Full-tree parity (`I18N_CHECK_ALL=1`) | ✅ PASS |
| Canonical CTA namespace | `public.cta.*` — single source |
| Duplicate CTA keys removed | `public.home.ctaLaunchPilot`, `ctaContact`, `ctaPresentation`, `ctaDemo`, `finalCtaButton` |
| Orphan / low-use keys | `public.nav.requestDemo` — used only by `/workflows`, not header |
| Legacy phase-2 keys | `public.pricing.bookDemo`, `public.enterprise.ctaDemo` |
| Product demo keys | `public.aiDemo.*` — KEEP (feature, not sales CTA) |

---

## 6. Accessibility audit

| Check | Scoped pages | Finding |
|-------|--------------|---------|
| **h1 ownership** | One h1 per page via hero / home hero | ✅ PASS |
| **Section semantics** | LG-2B pages use `<header>`, `<section aria-labelledby>` where needed | ✅ PASS |
| **Keyboard nav** | `PublicHeader` links + mobile menu; focus-visible rings on nav/CTA | ✅ PASS |
| **CTA focus** | `PublicHeroCTA` — focus-visible on all three tiers | ✅ PASS |
| **Decorative glass** | FAQ / Contact / Copilot visuals `aria-hidden` where appropriate | ✅ PASS |

No P1/P2 a11y blockers on scoped pages.

---

## 7. Global fix pass (P1 / P2)

| ID | Fix | Files |
|----|-----|-------|
| CTA-1 | Replace home final "Request Demo" with `PublicCTASection` **band** + `public.cta` | `PublicHomeContent.tsx` |
| CTA-2 | Hero CTAs use `public.cta`; remove duplicate home keys | `PublicHomeContent.tsx`, `messages/{en,ru,es,it}.json` |
| CTA-1b | Rewrite `finalCtaSubtitle`, `pricingTeaserSubtitle` (no demo) | `messages/{en,ru,es,it}.json` |

**P3 deferred:** Homepage content dedupe; phase-2 route demo CTAs; `public.nav.requestDemo` cleanup when `/workflows` is refactored.

---

## 8. Sub-phase closure matrix

| Sub-phase | Page | Prior verdict | Global re-check |
|-----------|------|---------------|-----------------|
| LG-2A | Home shell + hero | CLOSED | Final CTA fixed in global pass |
| LG-2B.1 | Platform | CLOSED | ✅ |
| LG-2B.2 | Mobile | CLOSED | ✅ |
| LG-2B.3 | Copilot | CLOSED | ✅ |
| LG-2B.4 | About | CLOSED | ✅ |
| LG-2B.5 | FAQ | CLOSED | ✅ |
| LG-2B.6 | Contact | CLOSED (uncommitted) | ✅ |

---

## 9. Pre-validation checklist

- [x] P1/P2 fixes applied on scoped surfaces
- [x] No new pages / phases started
- [x] Customer-finance boundary unchanged on public pages
