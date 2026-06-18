# AISTROYKA_LIQUID_GLASS_DIRECTION — Product Design Concept

**Phase:** LG-0  
**Date:** 2026-06-18  
**Product:** AISTROYKA.AI — AI Construction Management Platform

---

## 1. Core metaphor

### Primary: **「AI lens over the construction site」**

Liquid Glass is not decoration. For AISTROYKA it means:

> **Messy field reality → structured, transparent operational control.**

The material behaves like a **site superintendent's control lens**: you see through noise (scattered reports, photos, delays) to progress, risks, and evidence — with AI reframing what matters.

### Secondary mappings (skill material → product meaning)

| Liquid Glass property | AISTROYKA meaning |
|----------------------|-------------------|
| **Transparency** | No black box: reports, photos, approvals are visible end-to-end |
| **Lensing** | AI highlights deviations — a new angle on the same site |
| **Depth / layers** | Project → task → report → evidence hierarchy |
| **Fluidity** | Field data flows from mobile to dashboard without friction |
| **Adaptivity** | UI density adapts: marketing is immersive; dashboard is operational |

### Explicitly NOT our metaphor

- Crypto liquidity / money flow
- Generic “futuristic app”
- Playful consumer social UI
- Glass as wallpaper behind spreadsheets

---

## 2. Visual mood

| Attribute | Target |
|-----------|--------|
| Tone | Premium operational cockpit, not toy |
| Energy | Controlled confidence — calm power |
| Density | Marketing: airy; dashboard: information-dense core |
| Light | Dark-first; construction yellow as **signal**, not flood |
| Texture | Deep navy field + subtle site grid + restrained neural glow |
| Glass | Present at **edges of attention** — nav, hero lens, key actions |

**Reference mood board (conceptual):**

- Apple Liquid Glass **navigation discipline**
- Construction site at dusk (structure, clarity, artificial safety light)
- Mission control for building projects — not a nightclub

---

## 3. Color strategy

### Keep (brand equity)

| Token | Value | Role |
|-------|-------|------|
| `--aistroyka-accent` | `#F5C518` | Primary signal, CTA, AI highlights |
| `--aistroyka-bg-primary` | `#040a18` | Deep field |
| `--aistroyka-bg-secondary` | `#0b1428` | Elevated field |
| `--aistroyka-neural-core/accent` | Blues | Ambient depth only |
| Semantic colors | success/warning/error | Unchanged meaning |

### Add (glass-specific, LG-1)

| Token | Purpose |
|-------|---------|
| `--lg-tint-base` | Default glass density (navy-tinted) |
| `--lg-tint-strong` | Scrolled nav / prominent panels |
| `--lg-tint-accent` | Gold wash on hero lens only |
| `--lg-tint-clear` | Over media mocks |
| `--lg-intensity` | 25–90 user/system scalar (iOS 27) |
| `--lg-sheen-highlight` | Edge highlight (white/gold mix) |

### Rules

- Gold tint appears on **≤1 focal element** per viewport
- Never tint entire dashboard chrome gold
- Client/customer surfaces: reduce accent glow 30–40% vs marketing

---

## 4. Material strategy

### Layer hierarchy (non-negotiable)

```
[ Ambient field — no glass ]
[ Content — solid surfaces, tables, long text ]
[ Navigation glass — header, sidebar accent, floating CTAs ]
[ Overlay — badges, tooltips, modals ]
```

### Material variants (when to use)

| Variant | AISTROYKA use |
|---------|---------------|
| **Regular** | Public nav, feature cards, auth card |
| **Prominent** | Scrolled header, final CTA, modal shell |
| **Clear** | Device mock frame over screenshot/video |
| **Soft** | Dashboard top bar (LG-4), large panels |
| **Accent** | Single hero “site lens” panel only |
| **Identity (fallback)** | `prefers-reduced-transparency`: opaque `--aistroyka-surface` |

### Concentricity

- Public section radius 32px → inner glass card 24px (32 − 8 padding)
- Nav capsule: outer 24px → inner nav items 10px (`--aistroyka-radius-lg`)

---

## 5. Motion strategy

### Use (purpose-driven)

| Motion | Where | Why |
|--------|-------|-----|
| Materialization | Hero lens, section entry | “Control panel coming online” |
| Spring press (`scale 0.97`) | Glass CTA cards | Tactile confidence |
| One-shot sheen sweep | Hover on feature card | Light lens reaction — not loop |
| Nav density transition | Scroll > 24px | Adaptivity (iOS 27) |
| Intensity slider | Public + optional dashboard setting | User control of transparency |

### Avoid

- Infinite shimmer on all cards
- Parallax on report tables
- Floating animation on more than **one** element per page
- Morphing between unrelated routes (until View Transitions audited)
- Animating alert severity chips

### Easing tokens (from skill)

```css
--ease-bouncy: cubic-bezier(0.34, 1.56, 0.64, 1);  /* small elements */
--ease-snappy: cubic-bezier(0.22, 1, 0.36, 1);      /* cards */
--ease-gentle: cubic-bezier(0.16, 1, 0.3, 1);       /* large panels */
```

---

## 6. Page hierarchy (public)

### Tier 1 — Brand story

1. **Hero** — Value prop + single glass “live site lens”
2. **Three capability entry cards** — Dashboard / AI / Mobile
3. **Trust + metrics** — Solid typography; metrics not in glass (credibility)

### Tier 2 — Understanding

4. Pain + solution — **plain text** (content layer)
5. Modules grid — glass cards (max 4 visible)
6. Roles — solid cards (personas = content)

### Tier 3 — Conversion

7. AI section — text + CTA (glass optional on CTA wrapper only)
8. Mobile + pricing teasers — solid
9. Final CTA — prominent glass panel

### Navigation

- Glass capsule: Logo | 6 primary links | Demo + Cabinet + Login
- Mobile: glass sheet menu (prominent)

---

## 7. Do / Don't rules

### Do

- Tie every glass element to **navigation, hero lens, or primary action**
- Maintain WCAG AA contrast on all glass text
- Provide Safari/Firefox blur fallback
- Count glass nodes per viewport (≤6)
- Use construction-specific copy (“site”, “block”, “report”, “evidence”)
- Preserve `data-testid` on public CTAs
- Keep dashboard tables on `--aistroyka-surface`

### Don't

- Glass behind copilot messages or report tables
- Stack glass on glass (nav over modal over card)
- Use displacement on mobile (battery)
- Replace solid semantic colors with tinted glass
- Expose internal cost/margin UI to client surfaces — even with glass
- Copy skill demo “Flow” fintech narrative
- Add glass to owner/admin diagnostics

---

## 8. Copy tone examples

### Voice: confident, operational, human-in-the-loop

| Weak (generic) | Strong (AISTROYKA) |
|----------------|-------------------|
| Revolutionary AI platform | See block progress before the weekly meeting |
| Innovative construction solution | Daily reports, photos, and risks in one view |
| Neural magic | AI flags deviations — your team decides |
| Glass-clear finances | Transparent reporting from field to office |
| Next-gen ecosystem | Manager and worker apps tied to the same project |

### Hero direction (RU example)

> **Прогресс объекта — насквозь.**  
> Отчёты с площадки, фото-доказательства и риски в одном операционном контуре. ИИ подсвечивает отклонения — решения остаются за людьми.

### Hero direction (EN example)

> **See the site clearly.**  
> Field reports, photo evidence, and risks in one operational layer. AI surfaces deviations — your team stays in control.

---

## 9. Surface-specific direction notes

### Public marketing

Full metaphor expression. Immersive ambient field. Signature hero lens.

### Auth

Single glass card on ambient field — “entering the control room”. No displacement on form fields.

### Dashboard shell (LG-4)

Sidebar stays **solid**. Optional soft glass on **top bar only**. Content area unchanged.

### Manager project view

Intelligence cards: solid with accent border. Glass only on floating “Ask copilot” chip if added.

### Client/stakeholder

Calmer, document-forward. Glass limited to header chrome. **Product review required.**

### Mobile apps (iOS)

Web redesign does not change iOS SwiftUI chrome in LG phases. Align **tokens** only for future parity.

---

## 10. Success criteria (design)

- [ ] User describes site as “premium construction control”, not “crypto” or “generic AI”
- [ ] Glass count ≤6 per viewport on all redesigned pages
- [ ] Contrast audit passes on nav + hero + CTA
- [ ] Safari/Firefox fallback visually acceptable
- [ ] Dashboard data tables visually unchanged in density
- [ ] Client surfaces reviewed against customer-finance isolation roadmap
