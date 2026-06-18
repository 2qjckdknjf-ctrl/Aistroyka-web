# LIQUID_GLASS_LG1_FOUNDATION_REPORT

**Phase:** LG-1 (+ LG-1A reconciliation)  
**Date:** 2026-06-18  
**Verdict:** See `LIQUID_GLASS_LG1_POST_AUDIT.md`

---

## 1. What was implemented

### LG-1A — Spike reconciliation

- Reverted all public marketing integrations to pre-spike state.
- Deleted exploratory `components/public/liquid-glass/` and related public-only components.
- Consolidated reusable logic into canonical design system paths.

### LG-1 — Design system foundation

| Layer | Deliverable |
|-------|-------------|
| Tokens | `--lg-*` variables in `app/design-tokens.css` |
| CSS | `styles/liquid-glass.css` (4-layer classes, a11y, mobile) |
| TS API | `lib/design/liquid-glass.ts` |
| Components | `components/design/liquid-glass/*` (8 primitives) |
| Asset | `public/effects/glass-filter.svg` (static reference) |
| Tests | `lib/design/liquid-glass.test.ts` (4 tests) |
| Preview | `/[locale]/design/liquid-glass` (dev only, `notFound` in production) |
| Docs | Reconciliation, performance guardrails, this report, post-audit |

---

## 2. Spike reconciliation decision

**CANONICALIZE** core material implementation; **REVERT/DELETE** all public page wiring.

Details: `docs/design/LIQUID_GLASS_SPIKE_RECONCILIATION.md`

---

## 3. Canonical file paths

```
apps/web/
├── app/design-tokens.css              # --lg-* tokens
├── app/globals.css                    # imports liquid-glass.css
├── styles/liquid-glass.css
├── public/effects/glass-filter.svg
├── lib/design/liquid-glass.ts
├── lib/design/liquid-glass.test.ts
├── lib/design/design-tokens.ts        # re-exports LG API
├── components/design/
│   ├── index.ts
│   └── liquid-glass/
│       ├── LiquidGlass.tsx
│       ├── LiquidGlassFilter.tsx
│       ├── GlassSurface.tsx
│       ├── GlassButton.tsx
│       ├── GlassPanel.tsx
│       ├── GlassNav.tsx
│       ├── GlassHeroCard.tsx
│       ├── GlassIntensityControl.tsx
│       └── index.ts
└── app/[locale]/design/liquid-glass/  # dev preview only
```

---

## 4. Tokens added

| Token | Purpose |
|-------|---------|
| `--lg-intensity` | User/system density scalar (25–90) |
| `--lg-opacity` | Companion opacity preset |
| `--lg-blur` / `--lg-blur-refraction` | Fallback vs refraction blur |
| `--lg-saturation` | Reserved for future vibrancy |
| `--lg-tint` / `--lg-tint-strong` / `--lg-tint-clear` / `--lg-tint-accent` | Material tint |
| `--lg-border` | Edge separation |
| `--lg-sheen-opacity` / `--lg-sheen-highlight` / `--lg-sheen-bottom` | Specular layer |
| `--lg-refraction-strength` / `--lg-refraction-strength-soft` | Documentation constants |
| `--lg-radius` / `--lg-radius-pill` / `--lg-radius-control` | Concentric radii |
| `--lg-shadow` / `--lg-shadow-hover` | Elevation |
| `--lg-z-content` | Content stacking |
| `--lg-motion-duration` / `--lg-motion-sweep` / `--lg-motion-ease*` | Motion |

Existing `--aistroyka-*` tokens unchanged.

---

## 5. Components added

| Component | Role |
|-----------|------|
| `LiquidGlass` | Base 4-layer primitive; `intensity` + `variant` + `motion[]` |
| `LiquidGlassFilter` | SVG defs; reduced-motion aware |
| `GlassSurface` | Panel/card preset with padding |
| `GlassButton` | CTA with focus-visible on native button |
| `GlassPanel` | Short content panel with optional title |
| `GlassNav` | Nav capsule + `useGlassNavScrolled` hook |
| `GlassHeroCard` | LG-2 hero primitive |
| `GlassIntensityControl` | Preview-gated intensity slider |

---

## 6. Accessibility behavior

- `prefers-reduced-motion`: disables enter/float/sweep/spring active scale; SVG seed animation off in filter component.
- `prefers-reduced-transparency`: opaque `--aistroyka-surface` tint, simplified blur.
- `forced-colors: active`: Canvas/CanvasText fallback, backdrop-filter disabled.
- `GlassButton`: native `<button>` with `focus-visible` ring.
- Long text / tables: not placed in glass by primitives (documented contract).

---

## 7. Fallback behavior

| Environment | Behavior |
|-------------|----------|
| Chromium | Blur + SVG displacement |
| Safari / Firefox | `-webkit-backdrop-filter` blur + tint + sheen |
| `@supports not (backdrop-filter: url())` | Blur-only |
| Mobile ≤480px | Blur-only (no displacement URL) |
| Reduced transparency | Opaque surface |

---

## 8. Performance guardrails

Documented in `docs/design/LIQUID_GLASS_PERFORMANCE_GUARDRAILS.md`.

- Max 6 glass nodes per viewport (constant + dev warning).
- No displacement on mobile CSS breakpoint.
- No animated backdrop-filter.
- Single filter mount per tree.

---

## 9. Validation evidence

| Command | Result | Notes |
|---------|--------|-------|
| `git status` | OK | Public pages not modified; design files new |
| `bun run test lib/design/liquid-glass.test.ts` | **PASS** 4/4 | PATH without Volta |
| `bun x tsc --noEmit -p apps/web/tsconfig.json` | **PASS** | |
| `bun x eslint components/design ...` | **PASS** | |
| `bun run i18n:check` | **PASS** | No new i18n in LG-1 preview (hardcoded dev strings) |
| `bun run build` (root) | **PASS** | |
| `bun run lint` (package script) | **FAIL exit 126** | Volta toolchain — external |
| `bun run check:design` | **FAIL exit 1** | Pre-existing `red-600` in unrelated admin files |

**Alternative validation used** when Volta blocked npm scripts: direct `bun x` with sanitized `PATH`.

---

## 10. Remaining issues

| ID | Severity | Issue | Blocks LG-1 close? |
|----|----------|-------|-------------------|
| R-VOLTA | P3 | Local `bun run lint` fails Volta exit 126 | No — ESLint direct pass |
| R-DESIGN | P3 | `check:design` fails on pre-existing `red-600` in admin AI clients | No — unrelated to LG-1 |
| R-CF | P2 | `cf:build` not executed in LG-1 | No — defer to LG-5; `bun run build` passed |
| R-I18N-FWD | P3 | `public.glass` / `heroPreview` keys from spike remain in messages (unused) | No — forward-compatible for LG-2 |

**LG-1 closure:** See post-audit verdict.
