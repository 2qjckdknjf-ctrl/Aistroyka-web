# LG-2B.1 Platform Page Audit

**Date:** 2026-06-18  
**Phase:** LG-2B.1 — `/platform` redesign  
**Branch:** `design/liquid-glass-public-shell-lg2a`  
**Prerequisite:** LG-2B.0 (`7a97357d`), LG-2B audit (`bed1c5de`)

---

## 1. Page purpose (IA)

**Question answered:** “What is included in AISTROYKA?”

**Canonical owner of:** product capability map, operational stack, field-to-decision flow.

**Does NOT own:** company story (about), AI copilot narrative (copilot), mobile workflow depth (mobile), FAQ, contact conversion form.

**Homepage remains:** AI construction control teaser — platform hero uses **different** title/subtitle (unified operations platform).

---

## 2. Architecture decisions

| Decision | Rationale |
|----------|-----------|
| `PublicPageHero` `split-visual` | Platform needs visual stack, not homepage lens clone |
| `PlatformStackVisual` (local) | Page-specific stack diagram in `GlassHeroCard` — **not** `PublicHeroLens` |
| Hero CTAs disabled | Single canonical funnel via bottom `PublicCTASection` |
| `PublicFeatureGrid` 3-column | Six capability areas with one `glass-highlight` (Construction AI) |
| Cross-links | Field Reporting → `/mobile`; Construction AI → `/ai-construction-control` |
| `PublicTimelineSection` | Six-step field → visibility flow (solid cards) |
| `PublicProofSection` stat-row | Platform-specific stats (6/3/1) — **not** homepage 500+/12K+ metrics |
| `PublicCTASection` `floating` | Glass CTA band (1 node) per LG-2B.1 glass budget |

---

## 3. Section map

| Section | Component | Glass |
|---------|-----------|-------|
| A. Hero | `PublicPageHero` + `PlatformStackVisual` | 1× `GlassHeroCard` |
| B. Capability map | `PublicFeatureGrid` + `PublicFeatureCard` | 1× `glass-highlight` (Construction AI) |
| C. How it works | `PublicTimelineSection` | None |
| D. Proof | `PublicProofSection` stat-row | None |
| E. CTA | `PublicCTASection` floating | 1× `GlassPanel` |

---

## 4. Glass node count (page content)

| Node | Component |
|------|-----------|
| 1 | `PlatformStackVisual` → `GlassHeroCard` |
| 2 | Construction AI card → `GlassSurface` |
| 3 | CTA section → `GlassPanel` |

**Total page content:** 3 (within LG-2B.1 max 3)

**Layout (global):** `GlassNav` +1 in header — total viewport ~4, within `LG_MAX_VISIBLE_NODES = 6`.

---

## 5. Dedup compliance

| Rule | Status |
|------|--------|
| No `PublicHeroLens` | ✅ |
| No `PublicHeroMetrics` | ✅ |
| No homepage hero copy | ✅ |
| No homepage vanity metrics | ✅ |
| No “Request demo” in CTA | ✅ |
| Owner visibility without internal finance | ✅ (copy in `capOwnerVisibilityDesc`) |

---

## 6. Files touched

- `apps/web/app/[locale]/(public)/platform/page.tsx` — redesigned
- `apps/web/app/[locale]/(public)/platform/PlatformStackVisual.tsx` — new
- `apps/web/messages/{en,ru,es,it}.json` — `public.platform.*` expanded

---

## 7. i18n keys added

~50 keys under `public.platform.*` including hero, visual layers, 6 capabilities, 6 timeline steps, 3 proof stats, CTA band.

Removed legacy keys: `webPlatform`, `managerApp`, `workerApp`, `aiEngine`, `integrations` (+ Desc variants) — replaced by capability map.

---

## 8. Accessibility notes

- Single `h1` via `PublicPageHero`
- Section `h2` for proof block; grid/timeline use semantic structure
- FAQ-style cards not used — solid feature cards with link focus rings
- CTA focus states inherited from `PublicHeroCTA`
