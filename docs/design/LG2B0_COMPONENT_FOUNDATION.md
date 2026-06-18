# LG-2B.0 Component Foundation

**Date:** 2026-06-18  
**Phase:** LG-2B.0 — Shared public marketing components  
**Prerequisite:** LG-2A (`a59a014b`), LG-2B scope audit

---

## 1. Purpose

Establish reusable public-page building blocks **before** page redesign (LG-2B.1–2B.6) to prevent six inconsistent marketing styles.

**No production marketing pages were redesigned in LG-2B.0.**

---

## 2. Components implemented

| Component | File | Role |
|-----------|------|------|
| `PublicPageHero` | `PublicPageHero.tsx` | Non-home hero variants: `compact`, `centered`, `split-visual`, `conversion` |
| `PublicFeatureGrid` | `PublicFeatureGrid.tsx` | Responsive 2/3/4-column feature grids |
| `PublicFeatureCard` | `PublicFeatureCard.tsx` | Card primitive: `solid`, `subtle`, `glass-highlight`, `faq` |
| `PublicCTASection` | `PublicCTASection.tsx` | Canonical funnel band: `band`, `floating`, `inline` |
| `PublicProofSection` | `PublicProofSection.tsx` | Trust line, stat row (≤3), case snippets — **not** homepage hero metrics |
| `PublicTimelineSection` | `PublicTimelineSection.tsx` | Solid phased steps + optional inline CTA |

### LG-2A compatibility

| Component | LG-2B.0 change |
|-----------|----------------|
| `PublicHeroCTA` | Extended with `PUBLIC_CTA_HREFS`, optional hrefs, `showPresentation`, `testIdPrefix` — **homepage unchanged** |
| `PublicHeroLens` | **Not imported** by new components |
| `PublicHeroMetrics` | **Not imported** by new components |

---

## 3. PublicPageHero variants

| Variant | Layout | Glass | Default h1 |
|---------|--------|-------|------------|
| `compact` | Left-aligned, max-w-4xl | Optional `.public-badge` eyebrow only | ✅ |
| `centered` | Centered copy + optional visual below | None in copy block | ✅ |
| `split-visual` | Two-column copy + visual slot | Visual slot supplied by page (may use `GlassHeroCard` in 2B.1+) | ✅ |
| `conversion` | Short copy, **no inline CTAs** | None | ✅ |

**Props:** `eyebrow`, `eyebrowGlass`, `title`, `subtitle`, `headingLevel` (`h1`|`h2`), `visual`, `proofSlot`, `ctas`, `showPresentation`.

---

## 4. PublicFeatureCard variants

| Variant | Surface | Glass |
|---------|---------|-------|
| `solid` | Token surface + border + shadow | No |
| `subtle` | `bg-aistroyka-bg-primary` | No |
| `glass-highlight` | `GlassSurface` intensity `subtle` | Yes — max 1–2 per page at use time |
| `faq` | Solid + semantic `dl`/`dt`/`dd` | No |

---

## 5. PublicCTASection

**Hierarchy (fixed):**

1. Launch pilot → `/dashboard`
2. Contact us → `/contact`
3. Get presentation → `/contact`

**Variants:**

| Variant | Surface |
|---------|---------|
| `band` | Solid `bg-aistroyka-bg-primary` section |
| `floating` | `GlassPanel` intensity `subtle` (1 glass node when used) |
| `inline` | No section wrapper — for hero/timeline |

**i18n:** Defaults from `public.cta.*` via `useTranslations`.

**Does not use:** “Request demo”.

---

## 6. PublicProofSection

| Variant | Use |
|---------|-----|
| `trust-line` | Single trust sentence |
| `stat-row` | Up to 3 page-specific stats (solid typography) |
| `case-snippet` | Up to 2 case links |

**Explicit non-goal:** Duplicate homepage `500+/12K+/…` hero metrics block.

---

## 7. PublicTimelineSection

- Semantic `<ol>` steps with solid cards
- Optional `PublicCTASection` inline at bottom
- No glass on timeline steps

---

## 8. i18n keys added

```
public.cta.launchPilot
public.cta.contactUs
public.cta.getPresentation
public.cta.launchPilotHref
public.cta.contactHref
public.cta.presentationHref
```

Locales: **en**, **ru**, **es**, **it**.

Runtime hrefs use `PUBLIC_CTA_HREFS` in code (aligned with i18n href keys).

Legacy keys retained: `public.home.ctaLaunchPilot`, `public.nav.launchPilot`, etc.

---

## 9. Exports

All components exported from `components/public/index.ts`.

---

## 10. Glass governance compliance

| Rule | Status |
|------|--------|
| Imports only from `@/components/design/liquid-glass` | ✅ `GlassSurface`, `GlassPanel` |
| No `PublicHeroLens` in shared components | ✅ |
| Glass not on long text | ✅ |
| Default cards solid | ✅ |

---

## 11. Next phase entry (LG-2B.1 Platform)

1. Import `PublicPageHero` variant `split-visual`
2. Import `PublicFeatureGrid` + `PublicFeatureCard`
3. Import `PublicCTASection` variant `band`
4. Optional `PublicProofSection` trust-line
5. Apply content dedup from `LG2B_CONTENT_DEDUP_AUDIT.md`

Do **not** start until LG-2B.0 post-audit verdict is **CLOSED**.
