# LG-2B.2 Mobile Page Audit

**Date:** 2026-06-18  
**Phase:** LG-2B.2 — `/mobile` redesign  
**Branch:** `design/liquid-glass-public-shell-lg2a`  
**Prerequisite:** LG-2B.0 (`7a97357d`), LG-2B.1 (`098ec414`)

---

## 1. Page purpose (IA)

**Question answered:** “How do workers and managers operate on-site every day?”

**Canonical owner of:** field execution workflow, daily reporting, manager review loop.

**Does NOT own:** platform capability map (platform), AI construction control (homepage), company story (about), FAQ, contact form.

---

## 2. Architecture decisions

| Decision | Rationale |
|----------|-----------|
| `PublicPageHero` `split-visual` | Mobile needs workflow diagram, not homepage lens |
| `MobileWorkflowVisual` (local) | Page-specific loop in `GlassHeroCard` — **not** `PublicHeroLens` |
| Hero CTAs disabled | Single canonical funnel via bottom `PublicCTASection` |
| Two `PublicFeatureGrid` sections | Daily reporting (6 cards) + manager review (6 cards) |
| One `glass-highlight` | Daily report card only — core workflow emphasis |
| `PublicTimelineSection` | Seven-step field → record flow (solid cards) |
| `PublicProofSection` stat-row | Mobile-specific stats (2/6/1) — **not** homepage vanity metrics |
| `PublicCTASection` `floating` | Glass CTA band (1 node) per glass budget |

---

## 3. Section map

| Section | Component | Glass |
|---------|-----------|-------|
| A. Hero | `PublicPageHero` + `MobileWorkflowVisual` | 1× `GlassHeroCard` |
| B. Daily reporting | `PublicFeatureGrid` | 1× `glass-highlight` (Daily report) |
| C. Manager review | `PublicFeatureGrid` | None |
| D. Field timeline | `PublicTimelineSection` | None |
| E. Proof | `PublicProofSection` stat-row | None |
| F. CTA | `PublicCTASection` floating | 1× `GlassPanel` |

---

## 4. Glass node count (page content)

| Node | Component |
|------|-----------|
| 1 | `MobileWorkflowVisual` → `GlassHeroCard` |
| 2 | Daily report card → `GlassSurface` |
| 3 | CTA section → `GlassPanel` |

**Total page content:** 3 (within LG-2B.2 max 3)

---

## 5. Dedup compliance

| Rule | Status |
|------|--------|
| No `PublicHeroLens` | ✅ |
| No `PublicHeroMetrics` | ✅ |
| No homepage hero copy | ✅ |
| No platform capability map | ✅ |
| No AI/copilot architecture | ✅ |
| No homepage vanity metrics | ✅ |
| No “Request demo” in CTA | ✅ |

---

## 6. Files touched

- `apps/web/app/[locale]/(public)/mobile/page.tsx` — redesigned
- `apps/web/app/[locale]/(public)/mobile/MobileWorkflowVisual.tsx` — new
- `apps/web/messages/{en,ru,es,it}.json` — `public.mobile.*` expanded

---

## 7. i18n keys

~65 keys under `public.mobile.*` including hero, visual layers, 12 workflow cards, 7 timeline steps, 3 proof stats, CTA band.

Removed legacy keys: `managerApp`, `workerApp`, `fieldReporting`, `fastWorkflows` (+ Desc variants).

---

## 8. Accessibility notes

- Single `h1` via `PublicPageHero`
- Section `h2` for proof block; grids/timeline use semantic structure
- Solid feature cards with inherited focus rings from `PublicFeatureCard`
- CTA focus states inherited from `PublicHeroCTA`
