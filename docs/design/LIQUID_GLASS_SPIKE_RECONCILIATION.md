# LIQUID_GLASS_SPIKE_RECONCILIATION — LG-1A

**Date:** 2026-06-18  
**Phase:** LG-1A (spike reconciliation)

---

## 1. Spike file inventory

| File | Location (spike) | Status |
|------|------------------|--------|
| `LiquidGlass.tsx` | `components/public/liquid-glass/` | **DELETED** → canonicalized |
| `LiquidGlassFilter.tsx` | `components/public/liquid-glass/` | **DELETED** → canonicalized |
| `GlassIntensityControl.tsx` | `components/public/` | **DELETED** → canonicalized (preview-gated) |
| `HeroSitePreview.tsx` | `components/public/` | **DELETED** (LG-2 scope) |
| `PublicAmbientBackground.tsx` | `components/public/` | **DELETED** → replaced by `.lg-preview-field` CSS |
| `liquid-glass.css` | `styles/` | **CANONICALIZED** (tokens moved to `design-tokens.css`) |

---

## 2. Spike import map (before reconciliation)

| Consumer | Spike import |
|----------|--------------|
| `(public)/layout.tsx` | `LiquidGlassFilter`, `PublicAmbientBackground`, `GlassIntensityControl`, `public-liquid` |
| `PublicHomeContent.tsx` | `LiquidGlass`, `HeroSitePreview` |
| `PublicHeader.tsx` | `LiquidGlass` |
| `components/public/index.ts` | Re-exported all spike modules |
| `app/globals.css` | `@import "../styles/liquid-glass.css"` |

---

## 3. Usable vs unsafe

### Usable (canonicalized)

- 4-layer DOM structure (refraction / tint / sheen / content)
- SVG `feDisplacementMap` filter definitions
- Intensity via `--lg-intensity` CSS variable
- Spring motion classes (`lg--interactive`, `lg--enter`, `lg--glow`)
- `prefers-reduced-motion` and `prefers-reduced-transparency` blocks
- Mobile blur-only degradation `@media (max-width: 480px)`

### Unsafe / rejected

| Item | Reason | Action |
|------|--------|--------|
| Spike wired into public layout | Violates LG-1 scope (no page redesign) | **REVERTED** public layout to HEAD |
| Spike wired into home/header | Marketing redesign premature | **REVERTED** `PublicHomeContent`, `PublicHeader` |
| `components/public/liquid-glass/` path | Wrong layer for design system | **DELETED**; moved to `components/design/` |
| `public-liquid` layout class | Marketing-specific | **REMOVED** from CSS; preview uses `.lg-preview-field` |
| `HeroSitePreview` | Page-specific LG-2 content | **DELETED** (i18n keys retained for LG-2) |
| Production `GlassIntensityControl` on all public pages | Not gated | **Replaced** with `preview` prop; dev route only |
| Duplicate `:root` tokens in CSS file | Token sprawl | **Moved** to `app/design-tokens.css` |

---

## 4. Decision summary

| Asset | Decision |
|-------|----------|
| Core primitive logic | **A. CANONICALIZE** → `components/design/liquid-glass/` |
| CSS classes | **A. CANONICALIZE** → `styles/liquid-glass.css` |
| CSS variables | **A. CANONICALIZE** → `app/design-tokens.css` |
| Static SVG reference | **A. CANONICALIZE** → `public/effects/glass-filter.svg` |
| Public page integrations | **C. DELETE / REVERT** |
| `HeroSitePreview` | **C. DELETE** (LG-2) |
| `PublicAmbientBackground` | **C. DELETE** (preview CSS only) |

---

## 5. Actions taken

1. Restored `PublicHomeContent.tsx`, `PublicHeader.tsx`, `(public)/layout.tsx`, `components/public/index.ts` from git HEAD.
2. Deleted `components/public/liquid-glass/` directory and spike-only public components.
3. Created canonical `components/design/liquid-glass/*` (9 modules + index).
4. Created `lib/design/liquid-glass.ts` + unit tests.
5. Centralized `--lg-*` tokens in `app/design-tokens.css`.
6. Kept single CSS entrypoint: `globals.css` → `styles/liquid-glass.css`.
7. Added dev-only preview route: `/[locale]/design/liquid-glass` (`notFound()` in production).
8. Exported design system via `components/design/index.ts` and `lib/design/design-tokens.ts`.

---

## 6. Validation result

| Check | Result |
|-------|--------|
| Public pages free of `@/components/design` imports | **PASS** (grep verified) |
| Spike directory removed | **PASS** |
| Single CSS import path | **PASS** |
| `bun run test lib/design/liquid-glass.test.ts` | **PASS** (4/4) |
| `tsc --noEmit` | **PASS** |
| ESLint on `components/design` | **PASS** |
| `bun run build` | **PASS** |

**Canonical implementation path:** `@/components/design/liquid-glass` + `@/lib/design/liquid-glass` + `styles/liquid-glass.css` + `app/design-tokens.css` (`--lg-*`).
