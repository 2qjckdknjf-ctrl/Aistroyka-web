# LG-2B.4 About Page Audit

**Date:** 2026-06-18  
**Phase:** LG-2B.4 — `/about` redesign  
**Branch:** `design/liquid-glass-public-shell-lg2a`  
**Prerequisite:** LG-2B.3 (`a424ace8`)

---

## 1. Page purpose (IA)

**Question answered:** “Why does AISTROYKA exist and why should construction companies trust it?”

**Canonical owner of:** mission, industry problem, product philosophy, trust.

**Does NOT own:** platform capability map, mobile workflow, copilot assistant workflow, AI marketing page, contact form.

---

## 2. Ownership verification

| Page | Owns | About avoids |
|------|------|--------------|
| Homepage | AI construction control outcome | ✅ No hero lens / outcome teaser |
| Platform | Product capability map | ✅ `whySubtitle` points to platform for features |
| Mobile | Field execution workflow | ✅ No daily report steps |
| Copilot | AI assistant workflow | ✅ AI mentioned as philosophy only |
| About | Mission, problem, philosophy, trust | ✅ |

---

## 3. Architecture decisions

| Decision | Rationale |
|----------|-----------|
| `PublicPageHero` `split-visual` | About needs trust visual, not product diagrams |
| `AboutTrustVisual` (local) | Simple trust pillars in `GlassHeroCard` — not lens/workflow/insights |
| Hero CTAs disabled | Single canonical funnel via bottom `PublicCTASection` |
| Two `PublicFeatureGrid` sections | Industry problem (6) + Why AISTROYKA (6) |
| One `glass-highlight` | One operational record — core philosophy |
| `PublicTimelineSection` | Five product principles (solid cards) |
| `PublicProofSection` stat-row | Trust stats (1/3/5) — no invented certifications |
| `PublicCTASection` `floating` | Glass CTA band (1 node) |

---

## 4. Section map

| Section | Component | Glass |
|---------|-----------|-------|
| A. Hero | `PublicPageHero` + `AboutTrustVisual` | 1× `GlassHeroCard` |
| B. Industry problem | `PublicFeatureGrid` | None |
| C. Why AISTROYKA | `PublicFeatureGrid` | 1× `glass-highlight` |
| D. Product principles | `PublicTimelineSection` | None |
| E. Trust | `PublicProofSection` stat-row | None |
| F. CTA | `PublicCTASection` floating | 1× `GlassPanel` |

**Glass node count:** 3

---

## 5. Legacy keys removed

`mission`, `marketProblem`, `whyAistroyka`, `reliability` (+ Desc variants) — replaced by expanded IA keys.

---

## 6. Files touched

- `apps/web/app/[locale]/(public)/about/page.tsx`
- `apps/web/app/[locale]/(public)/about/AboutTrustVisual.tsx` (new)
- `apps/web/messages/{en,ru,es,it}.json`
