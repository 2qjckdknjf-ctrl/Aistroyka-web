# LG-3.3 Pricing — Scope Audit

**Date:** 2026-06-18  
**Phase:** LG-3.3  
**Route:** `/[locale]/pricing`  
**Authority:** Principal Product Architect + Conversion Architect

---

## 1. In scope

| Item | Scope |
|------|-------|
| `/pricing` page redesign | ✅ Full IA per LG-3.3 spec |
| `public.pricing.*` i18n | ✅ EN / RU / ES / IT |
| Home pricing teaser alignment | ✅ `pricingTeaserTitle/Subtitle/Cta` |
| Demo sales-language eradication on Pricing | ✅ Verify + document |
| Glass governance on Pricing | ✅ ≤ 3 nodes |
| Validation suite | ✅ check:design, lint, tsc, i18n×2, build, cf:build |
| Audit closure docs | ✅ This file set |

---

## 2. Out of scope (explicit deferrals)

| Item | Reason |
|------|--------|
| `/enterprise` redesign | Future LG phase — legacy shell remains; Pricing links out only |
| `/integrations` legacy page | Documented future phase (LG-3.2 precedent) |
| Dashboard `/subscribe` billing UI | Separate product surface — `subscriptionOnboarding.starter` is dashboard billing, not public pricing |
| Stripe checkout / plan SKUs | No public list pricing strategy |
| Nav restructuring | Pricing nav entry unchanged |
| `/ai-demo` interactive mock | Product demo, not sales demo |

---

## 3. Pricing strategy constraints

| Rule | Enforcement |
|------|-------------|
| Pilot-first | Hero + engagement models lead with Pilot |
| No fake pricing | No $/€ amounts, no per-seat public checkout |
| No subscription tiers on public site | Removed Starter/Pro/Business/Enterprise cards |
| No enterprise pricing table | Enterprise evaluation links to `/enterprise` |
| Allowed models | Pilot, project rollout, multi-project deployment, enterprise evaluation |

---

## 4. CTA hierarchy

| Surface | Primary | Secondary | Tertiary |
|---------|---------|-----------|----------|
| Pricing footer | Launch pilot (`/dashboard`) | Contact us (`/contact`) | Get presentation (`/contact`) |
| Engagement Pilot card | → `/dashboard` | — | — |
| Engagement project/multi | → `/contact` | — | — |
| Enterprise evaluation | → `/enterprise` | — | — |
| Hero | No inline CTAs (`ctas={false}`) | — | — |

Contact owns form workflow; Pricing owns **what** to buy/engage, not **how** to submit.

---

## 5. i18n scope

### Removed (dead public.pricing keys)

- `starter`, `pro`, `business`, `enterprise`
- `starterDesc`, `proDesc`, `businessDesc`, `enterpriseDesc`
- `requestQuote`

### Added (~67 keys)

- Hero, engagement models, included grid, process timeline, trust stats, related cards, CTA block

### Home keys updated

- `pricingTeaserTitle`, `pricingTeaserSubtitle`, `pricingTeaserCta`

---

## 6. Risk register (scope)

| ID | Risk | Phase handling |
|----|------|----------------|
| S-01 | Enterprise page still legacy | Pricing links only — no duplication |
| S-02 | Subscribe dashboard still shows plan names | Out of scope — not public marketing |
| S-03 | `aiDemo` nav label | Product mock — not sales demo |

---

## 7. Scope verdict

LG-3.3 scope is **bounded and sufficient** for Pricing ownership closure without expanding to Enterprise or Integrations redesign.
