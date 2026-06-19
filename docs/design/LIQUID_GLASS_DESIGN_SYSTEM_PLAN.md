# LIQUID_GLASS_DESIGN_SYSTEM_PLAN — Implementation Blueprint

**Phase:** LG-0 (plan only — no implementation)  
**Date:** 2026-06-18

---

## 1. Goals

1. Canonical Liquid Glass primitives reusable across **public**, **auth**, and **dashboard shell**
2. Strict separation from content/data components
3. Token-driven theming aligned with existing `--aistroyka-*`
4. Browser-safe degradation and accessibility fallbacks
5. Consolidate exploratory spike into approved architecture

---

## 2. Target file structure (LG-1)

```
apps/web/
├── app/
│   ├── design-tokens.css          # UPDATE: add --lg-* tokens
│   └── globals.css                # UPDATE: import liquid-glass.css
├── styles/
│   └── liquid-glass.css           # CANONICAL: 4-layer classes (from spike, refined)
├── public/
│   └── effects/
│       └── glass-filter.svg       # NEW: static SVG (optional duplicate of inline component)
├── lib/design/
│   ├── liquid-glass.ts            # NEW: variant types, intensity helpers, class maps
│   └── index.ts                   # UPDATE: export liquid-glass
└── components/design/
    ├── LiquidGlass.tsx            # NEW: canonical wrapper (relocate from public/)
    ├── LiquidGlassFilter.tsx      # NEW: SVG defs mount
    ├── GlassSurface.tsx           # NEW: opinionated surface (variant + padding presets)
    ├── GlassButton.tsx            # NEW: glass-styled CTA (marketing only)
    ├── GlassNav.tsx               # NEW: scroll-adaptive nav capsule
    ├── GlassIntensityControl.tsx  # NEW: iOS 27 slider
    └── PublicAmbientField.tsx     # NEW: marketing background (rename from spike)
```

**Deprecate after migration:** `components/public/liquid-glass/*` → re-export from `components/design/` for one release, then remove.

---

## 3. Token plan

### 3.1 Add to `design-tokens.css`

```css
/* —— Liquid Glass material —— */
--lg-intensity: 55;
--lg-radius: 24px;
--lg-radius-pill: 999px;

--lg-tint-base: rgba(11, 20, 40, 0.42);
--lg-tint-strong: rgba(8, 14, 28, 0.72);
--lg-tint-clear: rgba(4, 10, 24, 0.35);
--lg-tint-accent: rgba(245, 197, 24, 0.1);

--lg-sheen-top: rgba(255, 255, 255, 0.45);
--lg-sheen-bottom: rgba(255, 255, 255, 0.08);
--lg-shadow-rest: 0 8px 28px rgba(0, 0, 0, 0.28);
--lg-shadow-hover: 0 14px 36px rgba(0, 0, 0, 0.32);

/* Motion (glass-specific) */
--ease-bouncy: cubic-bezier(0.34, 1.56, 0.64, 1);
--ease-snappy: cubic-bezier(0.22, 1, 0.36, 1);
--ease-gentle: cubic-bezier(0.16, 1, 0.3, 1);
--lg-duration-materialize: 550ms;
--lg-duration-sweep: 900ms;
```

### 3.2 Tailwind extension (`tailwind.config.ts`)

Optional utilities (LG-1):

- `rounded-lg-glass` → `var(--lg-radius)`
- No Tailwind plugin required initially; CSS classes sufficient

### 3.3 TypeScript mirror (`lib/design/liquid-glass.ts`)

```ts
export type LiquidGlassVariant = "regular" | "prominent" | "clear" | "soft" | "accent";
export type LiquidGlassFeature = "interactive" | "glow" | "enter" | "float";

export const LG_INTENSITY_MIN = 25;
export const LG_INTENSITY_MAX = 90;
export const LG_INTENSITY_DEFAULT = 55;
export const LG_MAX_VISIBLE_NODES = 6;
```

---

## 4. Glass component architecture

### 4.1 `LiquidGlass` (primitive)

**Responsibility:** 4-layer DOM structure only.

```html
<div class="lg [modifiers]">
  <div class="lg__refraction" />
  <div class="lg__tint" />
  <div class="lg__sheen" />
  <div class="lg__content">{children}</div>
</div>
```

**Props:**

| Prop | Type | Default |
|------|------|---------|
| `variant` | LiquidGlassVariant | `regular` |
| `pill` | boolean | false |
| `interactive` | boolean | false |
| `glow` | boolean | false |
| `enter` | boolean | false |
| `float` | boolean | false |
| `className` | string | — |
| `contentClassName` | string | — |

**Rules:**

- `float` — max one per page (dev warning in dev mode)
- `glow` — sets `--gx`/`--gy` on pointermove
- Client component only if `glow` or `interactive` pointer handlers needed; otherwise server-compatible wrapper

### 4.2 `LiquidGlassFilter`

- Mount **once** per layout tree (public layout, optionally root if auth shares)
- `aria-hidden`, zero dimensions
- IDs: `#lg-refraction`, `#lg-refraction-soft`

### 4.3 `GlassSurface` (preset)

Wraps `LiquidGlass` with padding, radius, and variant defaults for marketing sections.

### 4.4 `GlassButton`

Marketing CTA only. Composes existing `btn-primary` semantics inside `lg__content` OR pairs glass container + primary button — **do not replace** dashboard `Button` component.

### 4.5 `GlassNav`

Extracts scroll listener from spike `PublicHeader`:

- `scrolled` → `variant="prominent"`
- `pill` always
- Slots: logo, links, actions

### 4.6 `GlassIntensityControl`

- Range 25–90 → `--lg-intensity` on `document.documentElement`
- `localStorage` key: `aistroyka-lg-intensity`
- Hidden on mobile (`sm:block`) — battery + touch UX
- i18n: `public.glass.intensity`

---

## 5. CSS class system (from skill, adapted)

Source of truth: `styles/liquid-glass.css` (skill `templates/glass-component.css` + AISTROYKA tints)

| Class | Layer |
|-------|-------|
| `.lg` | Root + shadow + isolation |
| `.lg__refraction` | backdrop-filter + url(#lg-refraction) |
| `.lg__tint` | color-mix intensity |
| `.lg__sheen` | inset highlight + sweep pseudo |
| `.lg__content` | z-index content |
| `.lg--prominent` | Stronger tint |
| `.lg--accent` | Gold gradient wash |
| `.lg--soft` | Soft displacement filter |
| `.lg--interactive` | Spring hover/active |
| `.lg--glow` | Cursor radial highlight |
| `.lg--enter` | Materialization keyframes |
| `.lg--float` | Single hero float |
| `.lg--pill` | border-radius 999px |

---

## 6. SVG filter integration

**Option A (preferred):** `LiquidGlassFilter.tsx` inline SVG in layout  
**Option B:** Static `public/effects/glass-filter.svg` + `<img>`/fetch — worse for CSP

**Chromium:** `backdrop-filter: blur(4px) url(#lg-refraction)`  
**Safari:** `-webkit-backdrop-filter: blur(14px)` only  
**Firefox:** blur fallback via `@supports not`

**Animated `feTurbulence seed`:** Disable on `prefers-reduced-motion` in LG-1.

---

## 7. Motion tokens

Integrate with existing `--aistroyka-duration-*`:

| Token | Use |
|-------|-----|
| `--aistroyka-duration-fast` | Button press in glass |
| `--lg-duration-materialize` | Enter animation |
| `--lg-duration-sweep` | Hover sheen |

**Reduced motion block:**

```css
@media (prefers-reduced-motion: reduce) {
  .lg--enter, .lg--float { animation: none; }
  .lg--interactive:active { transform: none; }
  .lg--interactive:hover .lg__sheen::after { animation: none; }
}
```

---

## 8. Accessibility rules

| Requirement | Implementation |
|-------------|----------------|
| Contrast ≥ 4.5:1 | Tint plate + text color tokens; test nav/hero/CTA |
| Focus visible | Ring on interactive children inside `lg__content` |
| Reduced motion | CSS media block |
| Reduced transparency | `@media (prefers-reduced-transparency: reduce)` → opaque surface |
| Intensity slider | `<label>` + `aria-valuenow` |
| Glass not conveying sole state | Pair icons + text for status |

---

## 9. Browser fallback strategy

| Browser | Refraction | Visual target |
|---------|------------|---------------|
| Chrome/Edge | Full | Liquid Glass |
| Safari | Blur + tint + sheen | Premium frosted panel |
| Firefox | Blur + tint + sheen | Same as Safari |
| Reduced transparency | Opaque card | Identity mode |

**QA matrix (LG-5):** Chrome macOS, Safari macOS/iOS, Firefox, mobile Chrome Android.

---

## 10. Responsive behavior

| Breakpoint | Behavior |
|------------|----------|
| `≥1024px` | Full displacement, hero side-by-side |
| `768–1023px` | Displacement on; stack hero |
| `≤480px` | No displacement; blur only; fewer glass nodes |
| Touch | `:active` scale; no hover sweep requirement |

---

## 11. Performance guardrails

1. **Max 6** `.lg` nodes in viewport — ESLint comment or dev-only counter hook
2. `isolation: isolate` + `contain: layout style paint` on refraction layer
3. Never animate `width`/`height` on glass nodes
4. Single global SVG filter instance
5. Lazy mount `GlassIntensityControl` (dynamic import optional)
6. Dashboard: **zero** displacement filters in data views (LG-4)

---

## 12. Integration with existing components

| Existing | LG relationship |
|----------|-----------------|
| `.btn-primary` / `.btn-secondary` | Unchanged; used inside glass content |
| `.card` / `.card-elevated` | Remain solid; dashboard default |
| `Panel` | Remove `backdrop-blur-sm` over time OR document as non-LG |
| `DashboardShell` | LG-4: optional `GlassNav` top strip only |
| `Logo` | Unchanged asset usage |
| `messages/*.json` | New keys under `public.glass.*` |

---

## 13. Spike consolidation checklist (LG-1 entry)

- [ ] Move `components/public/liquid-glass/*` → `components/design/*`
- [ ] Align token names with `design-tokens.css`
- [ ] Add `prefers-reduced-transparency` block (in spike CSS)
- [ ] Disable SVG seed animation under reduced motion
- [ ] Add `lib/design/liquid-glass.ts` types
- [ ] Public layout imports from `components/design/`
- [ ] Document glass node budget in component JSDoc
- [ ] Vendor skill into `.cursor/skills/liquid-glass-app-site/` (optional, repo policy)

---

## 14. Out of scope for design system

- Backend theme APIs
- Email template glass
- iOS SwiftUI Liquid Glass (separate mobile track)
- Android Compose theming
- PDF/print styles
