# LG-3.3 Pricing — Post-Audit

**Date:** 2026-06-18  
**Route:** `/[locale]/pricing`  
**Type:** Post-implementation verification

---

## 1. Pricing vs Enterprise

| Topic | Pricing | Enterprise |
|-------|---------|------------|
| SSO / scale / governance | Mentioned only in enterprise evaluation card + related link | Owns capability sections (legacy page) |
| Engagement path | Pilot → rollout → expansion | Evaluation for enterprise requirements |
| Pricing amounts | Explicitly absent | Explicitly absent |
| CTA | Launch pilot / Contact / Presentation | Legacy page CTAs (unchanged this phase) |

**Overlap:** ✅ Resolved — no enterprise capability grid on Pricing.

---

## 2. Pricing vs Contact

| Topic | Pricing | Contact |
|-------|---------|---------|
| Commercial models | ✅ Engagement grid | ❌ |
| Discovery form | ❌ | ✅ Form + process |
| Quote discussion | Points to Contact | Owns intake |
| Pilot launch | Footer CTA → `/dashboard` | Footer CTA → `/dashboard` |

**Overlap:** ✅ Complementary — Pricing explains models; Contact executes conversion.

---

## 3. Pricing vs Features

| Topic | Pricing | Features |
|-------|---------|----------|
| Capability catalog | "What's included" — commercial packaging lens | Full module catalog |
| Module depth | One-line inclusions + links | Grouped grids |

**Overlap:** ✅ Acceptable — Pricing lists typical inclusions, not exhaustive catalog.

---

## 4. Homepage teaser

| Before | After |
|--------|-------|
| Implied plans for every scale | "Commercial engagement" + pilot-first subtitle |
| CTA duplicated title | `pricingTeaserCta`: "See how we engage" (localized) |

---

## 5. CTA audit (cross-page)

| Page | Launch pilot | Contact | Presentation | Sales demo |
|------|--------------|---------|--------------|------------|
| Pricing | ✅ floating | ✅ | ✅ | ❌ |
| Home | ✅ band | ✅ | ✅ | ❌ |
| Features | ✅ floating | ✅ | ✅ | ❌ |
| Contact | ✅ floating | ✅ | ✅ | ❌ |

Canonical source: `public.cta.*`

---

## 6. Commercial promise audit

| Promise | Safe? |
|---------|-------|
| Pilot-first deployment | ✅ Matches product strategy |
| No public list pricing | ✅ Accurate |
| Scoped quotes via Contact | ✅ Accurate |
| Self-serve checkout | ❌ Not promised |
| Per-seat public pricing | ❌ Not promised |

---

## 7. Post-audit findings

| ID | Finding | Resolution |
|----|---------|------------|
| PA-01 | "engagement tier" in Copilot inclusion copy | Fixed EN/RU — scope-based wording |
| PA-02 | Enterprise page legacy | Documented deferral — no Pricing duplication |
| PA-03 | Dashboard subscribe plans | Out of scope — not public marketing |

No open P0/P1 post-audit blockers.

---

## 8. Post-audit verdict

Pricing boundary post-check **PASS** — ready for no-tail closure.
