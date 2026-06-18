# LG-2A Visual Self-Audit

**Date:** 2026-06-18  
**Phase:** LG-2A — Public Shell + Header + Hero + Ambient Field  
**Branch:** `design/liquid-glass-public-shell-lg2a`

---

## 1. What changed

| Surface | Change |
|---------|--------|
| `(public)/layout.tsx` | Ambient field + single `LiquidGlassFilter` mount; content layered above field |
| `PublicHeader.tsx` | Canonical `GlassNav` with scroll-adaptive intensity; header CTAs → Contact us |
| `PublicHomeContent.tsx` | Hero only — two-column lens layout, metric chips, new CTA system |
| **New** `PublicAmbientField.tsx` | Fixed CSS grid + glow orbs (non-interactive) |
| **New** `PublicLiquidGlassRoot.tsx` | Client filter mount for public tree |
| **New** `PublicHeroLens.tsx` | Signature `GlassHeroCard` site lens panel |
| **New** `PublicHeroMetrics.tsx` | 4× `GlassSurface` subtle metric chips |
| **New** `PublicHeroCTA.tsx` | Launch pilot / Contact us / Get presentation links |
| `globals.css` | `.public-ambient-*` shell utilities (no duplicate glass CSS) |
| `messages/{en,ru,es,it}.json` | Hero copy, lens strings, nav `contactUs` |

**Not touched:** dashboard, auth, admin, API, footer body, homepage sections below hero, other marketing pages.

---

## 2. Manual inspection notes

- **Metaphor:** Hero presents “AI lens over the site” via `PublicHeroLens` with live-style stats and data stream lines.
- **Header:** Glass nav capsule replaces flat bordered bar; logo and links remain sharp on tinted glass.
- **Atmosphere:** Deep navy + 48px construction grid + two soft glow orbs (neural core + accent mix).
- **CTAs:** Primary → `/dashboard` (Launch pilot); secondary → `/contact`; tertiary presentation link.
- **Screenshot:** Not captured in CI environment; visual review recommended locally at `/en` and `/ru`.

---

## 3. Glass node count above fold (homepage)

| Node | Component | Count |
|------|-----------|-------|
| Header nav | `GlassNav` | 1 |
| Hero lens | `GlassHeroCard` | 1 |
| Metric chips | `GlassSurface` × 4 | 4 |
| **Total** | | **6** |

Within `LG_MAX_VISIBLE_NODES = 6` budget. CTAs use solid `btn-primary` / `btn-secondary` (not glass).

---

## 4. Mobile behavior

- Hero stacks: copy + CTAs + metrics above lens card on narrow viewports.
- Header: icon logo, cabinet CTA, burger menu preserved.
- Mobile menu: **solid** `bg-aistroyka-surface` panel (not glass) for readability.
- Metric chips: 2×2 grid on mobile.
- Displacement refraction disabled on ≤480px via existing `liquid-glass.css` media query.

---

## 5. Accessibility notes

- Single `h1` on homepage (unchanged pattern).
- `nav` landmarks preserved with `aria-label` from i18n.
- Decorative ambient field and lens stream: `aria-hidden`.
- Focus-visible rings on header links and menu toggle.
- Metric list uses semantic `ul` with `aria-label`.
- Lens stats use `dl` / `dt` / `dd`.
- `prefers-reduced-motion`: ambient glow animations disabled; glass motion modifiers respect existing CSS.

---

## 6. Performance notes

- Ambient field: CSS only, `position: fixed`, no JS.
- `LiquidGlassFilter`: one mount per public layout; SVG seed animation respects reduced motion.
- Hero mostly server-rendered; client boundaries only at glass primitives and header scroll hook.
- No continuous backdrop-filter animation loops added.

---

## 7. Pages intentionally not touched

- `/platform`, `/mobile`, `/copilot`, `/about`, `/faq`, `/contact`, `/pricing`, etc. (LG-2B)
- Dashboard, auth, admin, owner/stakeholder surfaces
- `PublicFooter` (unchanged)
