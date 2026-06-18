# LIQUID_GLASS_PERFORMANCE_GUARDRAILS

**Phase:** LG-1  
**Date:** 2026-06-18

---

## 1. Glass node budget

| Rule | Value | Enforcement |
|------|-------|-------------|
| Max visible `.lg` nodes per viewport | **6** | `LG_MAX_VISIBLE_NODES` in `lib/design/liquid-glass.ts`; dev `warnIfGlassBudgetExceeded()` |
| Max `lg--float` per page | **1** | Documented in `GlassHeroCard`; LG-2 review |
| `LiquidGlassFilter` mounts per tree | **1** | Component docs + preview layout |

---

## 2. GPU / compositing

- Each `.lg` uses `isolation: isolate` and `contain: layout style paint` on refraction layer.
- Do **not** animate `width`, `height`, or `border-radius` on glass nodes — use `transform` only.
- Avoid nested glass (`lg` inside `lg`) — tint stacks reduce readability and double GPU cost.

---

## 3. Mobile / low-power

```css
@media (max-width: 480px) {
  .lg__refraction {
    backdrop-filter: blur(var(--lg-blur-refraction));
    /* no url(#lg-refraction) — displacement disabled */
  }
}
```

- Nav/hero variants also drop displacement on small screens.
- Intensity slider hidden on preview except `sm+` — not shipped to production pages in LG-1.

---

## 4. Animation limits

| Allowed | Forbidden |
|---------|-----------|
| One-shot hover sheen (`lg-sweep`) | Infinite sheen loops |
| `lg--enter` on mount (once) | Continuous backdrop-filter animation |
| `lg--float` on **one** hero element | Multiple floating glass panels |
| SVG seed animate (14s) when motion OK | Seed animate when `prefers-reduced-motion` |

`LiquidGlassFilter` disables `feTurbulence` seed animation when `prefers-reduced-motion: reduce`.

---

## 5. Browser-specific cost

| Browser | Refraction | Cost profile |
|---------|------------|--------------|
| Chromium | `backdrop-filter: url(#lg-refraction)` | Highest — budget strictly |
| Safari | Blur-only fallback | Medium |
| Firefox | Blur-only fallback | Medium |

---

## 6. Dashboard / data surfaces (LG-4+)

- **Zero** displacement filters on pages with tables, reports, or copilot transcripts.
- Sidebar remains solid `bg-aistroyka-surface`.
- Optional soft glass limited to top navigation strip.

---

## 7. OpenNext / Cloudflare

- Inline SVG filter in React layout is compatible with `bun run build` (verified LG-1).
- `cf:build` not re-run in LG-1 (time); recommend LG-5 gate before production promotion.

---

## 8. Monitoring checklist (LG-5)

- [ ] Lighthouse performance delta on `/` and `/dashboard` < 10%
- [ ] Safari iOS scroll jank test on glass nav (LG-2)
- [ ] Chrome DevTools layer count on home ≤ 6 glass layers
- [ ] Battery profile on mobile with glass nav disabled vs enabled
