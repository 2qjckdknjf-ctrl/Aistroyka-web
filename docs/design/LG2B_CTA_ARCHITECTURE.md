# LG-2B CTA Architecture

**Date:** 2026-06-18  
**Target hierarchy (product-wide):**

| Tier | Label (EN) | Destination | Role |
|------|------------|-------------|------|
| **Primary** | Launch pilot | `/dashboard` | Product entry / pilot start |
| **Secondary** | Contact us | `/contact` | Human sales / lead |
| **Tertiary** | Get presentation | `/contact` (or `?intent=presentation`) | Low-friction ask |

**Explicit ban in hero bands:** “Request demo” as primary/secondary label (LG-2A hero rule extends to all LG-2B heroes).

Demo intent may appear **inside contact form** copy or field labels — not as competing hero CTA.

---

## 1. Current CTA chaos audit

### 1.1 Canonical (LG-2A — correct)

| Location | CTAs | Status |
|----------|------|--------|
| Home hero (`PublicHeroCTA`) | Launch pilot / Contact us / Get presentation | ✅ **Canonical** |
| Header desktop | Contact us + Dashboard + Login | ✅ Secondary aligned |

### 1.2 Legacy “Request Demo” fragmentation

| Location | Key | Label (EN) | href | Issue |
|----------|-----|------------|------|-------|
| Home final CTA | `public.home.finalCtaButton` | Request Demo | `/contact` | ❌ Breaks hierarchy; duplicates demo language |
| `/copilot` hero | `public.copilot.ctaDemo` | Request Demo | `/contact` | ❌ Should be Contact us or Launch pilot |
| `/enterprise` | `ctaDemo`, `ctaSales` | Enterprise demo / Talk to sales | `/contact` | ⚠️ Sales OK as secondary variant; demo label rewrite |
| `/workflows` | `public.nav.requestDemo` | Request Demo | `/contact` | ❌ |
| `/pricing` (×4 plans) | `bookDemo`, `requestQuote` | Book demo / Request quote | `/contact` | ⚠️ Quote OK; book demo → Contact us |
| `/implementation` | `ctaPlan`, `ctaConsult` | Plan / Consult | `/contact` | ⚠️ Acceptable secondary wording |
| `/integrations`, `/api`, `/partners` | various | Enterprise / workflow CTAs | `/contact` | ⚠️ Rewrite to secondary Contact us + context in subtitle |

### 1.3 Missing CTAs (conversion leak)

| Page | Current | Issue |
|------|---------|-------|
| `/platform` | None | Dead end — high nav traffic |
| `/mobile` | None | Dead end after home teaser |
| `/about` | None | Narrative without funnel |
| `/faq` | None | Objection page without next step |
| `/features`, `/solutions`, `/security` | None | Catalog dead ends |
| `/ai-construction-control` | None | AI story without action |

### 1.4 Competing primary CTAs

| Page | Primary today | Conflict |
|------|---------------|----------|
| `/copilot` | Request Demo | Should not outrank Launch pilot |
| Home final band | Request Demo | Undermines hero Launch pilot |
| `/ai-demo` | `#demo` scroll | OK for page-local demo; add bottom `PublicCTASection` |

### 1.5 Internal navigation CTAs (not conversion)

| Page | CTA | Verdict |
|------|-----|---------|
| Home → `/ai-construction-control` | Learn more | ✅ Keep (teaser) |
| Home → `/mobile` | Mobile CTA | ✅ Keep |
| Home → `/pricing` | Pricing title as button | ⚠️ Rewrite label to “View pricing” |
| `/copilot` → `/platform` | Explore platform | ✅ Keep as secondary **page** CTA (not global conversion) |

---

## 2. Target CTA model

### 2.1 Global conversion bundle (`PublicCTASection`)

Every marketing page ends with:

```
[ Launch pilot ]  [ Contact us ]  Get presentation
```

Reuse `PublicHeroCTA` + i18n keys:

- `public.home.ctaLaunchPilot` (or migrate to `public.cta.launchPilot`)
- `public.home.ctaContact`
- `public.home.ctaPresentation`

### 2.2 Page-level hero CTAs (optional, max 2 buttons)

| Page type | Primary | Secondary |
|-----------|---------|-----------|
| Product story (copilot, platform) | Launch pilot | Contact us **OR** internal link (Explore platform) |
| Conversion (contact) | — (form is primary) | — |
| Catalog (features, faq) | None in hero | CTAs only in bottom band |

**Rule:** Hero never shows more than 2 buttons + 1 tertiary link.

### 2.3 Header (unchanged LG-2A)

- Contact us (secondary style)
- Dashboard / Login

### 2.4 Contact form

- Submit button: keep `public.form.send`
- Demo block copy: may mention demo/presentation — **informational**, not a competing site-wide CTA label

---

## 3. Migration map (i18n rewrite)

| Old key / pattern | New behavior | Phase |
|-------------------|--------------|-------|
| `finalCtaButton` → Request Demo | Primary Launch pilot + secondary Contact us | LG-2B.0 home tail or 2B.1 |
| `copilot.ctaDemo` | `ctaContact` or shared launchPilot | LG-2B.3 |
| `public.nav.requestDemo` on workflows | `ctaContact` | Phase 2 |
| `pricing.bookDemo` | `ctaContact` | Phase 2 |
| Multiple `/contact` only labels | Consolidate wording; optional query params later | Phase 2 |

---

## 4. Funnel diagram

```
                    ┌─────────────┐
     Header ───────►│ Contact us  │
                    └──────┬──────┘
                           │
    ┌──────────────────────┼──────────────────────┐
    ▼                      ▼                      ▼
 Home hero            Marketing pages         /contact form
 Launch pilot ─────► /dashboard              (conversion)
 Contact us ────────► /contact
 Get presentation ──► /contact
```

**Every LG-2B page** must connect into this funnel via bottom `PublicCTASection`.

---

## 5. Page-specific CTA plan (LG-2B.1–2B.6)

| Page | Hero CTAs | Bottom band | Notes |
|------|-----------|-------------|-------|
| **Platform** | — | Full bundle | Add cross-links to /mobile, /copilot in content |
| **Mobile** | Launch pilot | Full bundle | Store links deferred (text-only policy) |
| **Copilot** | Launch pilot + Explore platform | Full bundle | Remove Request Demo |
| **About** | — | Full bundle | |
| **FAQ** | — | Full bundle | After last FAQ item |
| **Contact** | — | Tertiary only under form? | Form = primary action; optional presentation link below |

---

## 6. Metrics / success (implementation phase)

- Zero instances of “Request Demo” in hero or `PublicCTASection` bands
- 100% of LG-2B.1–2B.6 pages include `PublicCTASection`
- Primary button always routes to `/dashboard` unless page is contact (form exception)

---

## 7. CTA architecture verdict

| Aspect | Status |
|--------|--------|
| Target hierarchy defined | ✅ |
| Current chaos documented | ✅ |
| Migration path clear | ✅ |
| Blockers for implementation | None — i18n rewrites scoped per sub-phase |
