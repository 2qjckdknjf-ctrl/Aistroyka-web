# LG-2B.6 Contact Page Audit

**Date:** 2026-06-18  
**Phase:** LG-2B.6 — `/contact` redesign  
**Branch:** `design/liquid-glass-public-shell-lg2a`  
**Prerequisite:** LG-2B.5 (`bf9fe089`)

---

## 1. Page purpose (IA)

**Question answered:** “How do I start working with AISTROYKA?”

**Canonical owner of:** conversion — pilot launch and communication.

**Does NOT own:** product map, workflows, mission, FAQ answers.

---

## 2. Conversion ownership verification

| Page | Owns | Contact avoids |
|------|------|----------------|
| Homepage | Outcome teaser | ✅ |
| Platform / Mobile / Copilot / About / FAQ | Depth elsewhere | ✅ Short conversion copy only |
| Contact | Pilot + form + process | ✅ |

---

## 3. Request Demo cleanup (contact scope)

| Item | Before | After |
|------|--------|-------|
| `demoBlockTitle` | "Request a demo" | **Removed** |
| `businessCtaDetails` | Mention "Demo" in message | **Removed** |
| `metaDescription` | "request a demo" | Pilot/onboarding language |
| Bottom duplicate demo section | Second `<section>` | **Removed** |

**Contact page:** no Request Demo / Book Demo strings remain.

### Request Demo audit — elsewhere (document only, out of scope)

| Location | Key / usage | Severity |
|----------|-------------|----------|
| `public.home.finalCtaButton` | "Request Demo" | P3 — homepage |
| `public.home.ctaDemo` | "Request Demo" | P3 — homepage |
| `public.nav.requestDemo` | Nav label | P3 — shell |
| `public.pricing.metaDescription` | "book a demo" | P3 — pricing page |
| `public.pricing.bookDemo` | "Book demo" | P3 — pricing page |

---

## 4. Form preservation verification

| Check | Status |
|-------|--------|
| `ContactForm.tsx` unchanged | ✅ |
| POST `/api/contact` handler preserved | ✅ |
| `public.form.*` labels unchanged | ✅ |
| Form wrapper solid (no glass) | ✅ |
| `#contact-form` anchor for method cards | ✅ |

---

## 5. Architecture decisions

| Decision | Rationale |
|----------|-----------|
| `PublicPageHero` + `ContactConversionVisual` | Conversion hero — 1 glass node |
| `PublicTimelineSection` | 5-step pilot process (solid) |
| Two `PublicFeatureGrid` sections | Who (6) + methods (3) — solid |
| Existing `ContactForm` in solid card | Do not break working submission |
| `PublicCTASection` floating | Canonical CTA — 2nd glass node |
| Glass budget **2** | Hero + CTA only |

---

## 6. CTA verification

| CTA | Source |
|-----|--------|
| Launch pilot | `public.cta.launchPilot` → `/dashboard` |
| Contact us | `public.cta.contactUs` → `/contact` |
| Get presentation | `public.cta.getPresentation` → `/contact` |

No Request Demo on contact page.

---

## 7. Files touched

- `apps/web/app/[locale]/(public)/contact/page.tsx`
- `apps/web/app/[locale]/(public)/contact/ContactConversionVisual.tsx` (new)
- `apps/web/messages/{en,ru,es,it}.json`
- `ContactForm.tsx` — **not modified**

Legacy keys removed: `demoBlockTitle`, `businessCta`, `businessCtaDetails`.
