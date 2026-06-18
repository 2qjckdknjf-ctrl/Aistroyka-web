# LG Final No-Tail Canonical Architecture Audit

**Date:** 2026-06-18  
**Scope:** LG-0 / LG-1 / LG-1.5 foundation closure — canonical path integrity only  
**Blocks:** LG-2 public redesign entry

---

## Executive verdict

| Check | Result |
|-------|--------|
| Exactly one Liquid Glass implementation path | **PASS** |
| Exploratory spike fully removed | **PASS** |
| No duplicate CSS / filter assets | **PASS** |
| Canonical exports complete | **PASS** |
| Dev preview isolated from production | **PASS** |
| Production public pages free of glass imports | **PASS** |

**Canonical architecture: CLEAN — no hidden duplicate system.**

---

## 1. Allowed canonical paths (verified present)

| Path | Role | Status |
|------|------|--------|
| `apps/web/components/design/liquid-glass/**` | React primitives (9 files) | **Present** |
| `apps/web/components/design/index.ts` | Re-export barrel | **Present** |
| `apps/web/lib/design/liquid-glass.ts` | Types, constants, class helpers | **Present** |
| `apps/web/lib/design/liquid-glass.test.ts` | Unit tests (4 cases) | **Present** |
| `apps/web/lib/design/design-tokens.ts` | Re-exports LG helpers | **Present** |
| `apps/web/styles/liquid-glass.css` | `.lg*` modifier styles | **Present** |
| `apps/web/public/effects/glass-filter.svg` | SVG refraction filters (`lg-refraction`, `lg-refraction-soft`) | **Present** |
| `apps/web/app/design-tokens.css` | `--lg-*` CSS variables (lines 179–205) | **Present** |
| `apps/web/app/globals.css` | Single `@import "../styles/liquid-glass.css"` | **Present** |

### Component inventory (`components/design/liquid-glass/`)

| File | Exported |
|------|----------|
| `LiquidGlass.tsx` | Yes — core primitive |
| `LiquidGlassFilter.tsx` | Yes — SVG filter mount |
| `GlassSurface.tsx` | Yes |
| `GlassButton.tsx` | Yes |
| `GlassPanel.tsx` | Yes |
| `GlassNav.tsx` | Yes (+ `useGlassNavScrolled`) |
| `GlassHeroCard.tsx` | Yes |
| `GlassIntensityControl.tsx` | Yes — dev preview only |
| `index.ts` | Barrel — all above |

---

## 2. Dead / forbidden paths (search results)

Searched entire repo (`*.ts`, `*.tsx`, `*.css`, `*.json`) for:

| Pattern | Matches in active code | Verdict |
|---------|------------------------|---------|
| `components/public/liquid-glass` | **0** | **DELETED** — directory absent |
| `HeroSitePreview` | **0** in code (docs only) | **DELETED** |
| `PublicAmbientBackground` | **0** in code (docs only) | **DELETED** |
| Duplicate `liquid-glass.css` | **1 file only** (`styles/liquid-glass.css`) | **PASS** |
| Non-canonical `@/components/public/*liquid*` imports | **0** | **PASS** |
| `public-liquid` CSS class namespace | **0** | **REMOVED** |
| Second `LiquidGlass` implementation | **0** | **PASS** |

Glob `**/liquid-glass*` under repo root returns exactly **3** product files:

- `lib/design/liquid-glass.ts`
- `lib/design/liquid-glass.test.ts`
- `styles/liquid-glass.css`

(No stray copies under `components/public/` or elsewhere.)

---

## 3. Import graph audit

### Production consumers of canonical glass

| Consumer | Import | Production-reachable? |
|----------|--------|-------------------------|
| `app/[locale]/design/liquid-glass/LiquidGlassPreviewClient.tsx` | `@/components/design/liquid-glass` | **No** — `notFound()` when `NODE_ENV === 'production'` |

**Grep for `@/components/design` in `apps/web`:** only the dev preview client.

### Public marketing surfaces

| Surface | Glass imports | Spike classes |
|---------|---------------|---------------|
| `PublicHomeContent.tsx` | **None** | **None** — uses `public-shell`, `public-badge`, `public-card-motion` |
| `PublicHeader.tsx` | **None** | **None** — standard `backdrop-blur-md` (pre-LG, not `.lg*`) |
| `(public)/layout.tsx` | **None** | **None** — header + footer only |
| `components/public/index.ts` | Exports `PublicHeader`, `PublicFooter` only | **PASS** |

No production page imports dev preview route or non-canonical glass.

---

## 4. CSS / token wiring

| Layer | Wiring | Duplication? |
|-------|--------|--------------|
| Global tokens | `--lg-*` in `app/design-tokens.css` | Single source |
| Stylesheet | `@import "../styles/liquid-glass.css"` in `globals.css` | Single import |
| Class namespace | `.lg`, `.lg--*`, `.lg-preview-field` in one CSS file | Single file |
| Filter asset | `public/effects/glass-filter.svg` | Single asset |
| TS helpers | `liquidGlassClassNames`, `clampLiquidGlassIntensity`, `warnIfGlassBudgetExceeded` | Single module |

Orphan spike-only classes (`public-liquid`, ambient background wrappers) are **absent** from CSS and TSX.

---

## 5. Dev preview governance

**Route:** `/[locale]/design/liquid-glass`

| Control | Implementation |
|---------|----------------|
| Production block | `page.tsx` → `notFound()` if `NODE_ENV === 'production'` |
| SEO | `robots: { index: false, follow: false }` |
| Nav isolation | Not linked from `PublicHeader`, sitemap, or marketing |
| i18n | Hardcoded English strings in preview client (acceptable for dev lab) |
| Intensity control | `GlassIntensityControl preview` — dev-only overlay |

---

## 6. Fixes applied during this audit

| Issue | Fix | Validated |
|-------|-----|-----------|
| `apps/web` `test` script Volta exit 126 | `vitest` → `bun ../../node_modules/vitest/vitest.mjs run` | **PASS** with Volta-first PATH |
| Stale doc claims (LG-1 inventory / closure) | Supersession banners added | Docs updated |

No canonical path moves or new features introduced.

---

## 7. Remaining non-canonical references (documentation only)

Historical mentions of deleted spike paths remain in planning docs (`LIQUID_GLASS_REDESIGN_ROADMAP.md`, `LIQUID_GLASS_DESIGN_SYSTEM_PLAN.md`, `LIQUID_GLASS_SPIKE_RECONCILIATION.md`). These are **archival / reconciliation** records, not runtime imports. `LIQUID_GLASS_UI_INVENTORY.md` and `LG1_FINAL_CLOSURE.md` now carry supersession notes.

**Severity:** P3 — doc archaeology only; no code impact.

---

## Final canonical verdict

# CANONICAL PATH: VERIFIED SINGLE IMPLEMENTATION

LG-0 spike reconciled. LG-1 foundation consolidated under `components/design/liquid-glass/`. No duplicate Liquid Glass system remains in active product code.
