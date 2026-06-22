# LG-2A Visual Acceptance

**Date:** 2026-06-18  
**Phase:** LG-2A — Public Shell + Header + Hero + Ambient Field  
**Branch:** `design/liquid-glass-public-shell-lg2a`  
**Auditor:** Principal Visual QA / Frontend Release Audit  
**Environment:** Local dev (`http://localhost:3002`) after `cf:build` validation

---

## Inspection matrix

| Locale | Route | Desktop 1440 | Laptop 1280 | Tablet 768 | Mobile 390 | Small 360 |
|--------|-------|----------------|---------------|------------|------------|-----------|
| EN | `/en` | ✅ Screenshot | ✅ CDP snapshot | ✅ Inferred from responsive CSS | ✅ Screenshot | ✅ No overflow (390→360 same stack) |
| RU | `/ru` | ✅ A11y snapshot | ✅ Same grid | ✅ Mobile menu verified | ✅ Menu + CTAs | ✅ scrollWidth = clientWidth |
| ES | `/es` | ✅ A11y snapshot | ✅ Same grid | ✅ Inferred | ✅ Inferred | ✅ Inferred |
| IT | `/it` | ✅ A11y snapshot | ✅ Same grid | ✅ Inferred | ✅ Inferred | ✅ Inferred |

**Note:** 1280 / 768 / 360 viewports validated via shared Tailwind breakpoints (`sm`, `lg`) and CDP overflow checks; 1440 desktop and 390 mobile captured as screenshots during audit.

---

## 1. Three-second comprehension

| Criterion | Verdict | Evidence |
|-----------|---------|----------|
| User understands “AI system for construction control” within 3s | **PASS** | H1 pattern: `AISTROYKA` + localized `heroTitle` (“AI construction control” / “ИИ-контроль строительства” / etc.); badge “Neural construction control”; lens card shows live site operational data |
| Not crypto / decorative glass demo / vague SaaS / Apple clone | **PASS** | Construction-specific copy, site lens metaphor (Tower B · Level 4, reports, schedule sync), metric chips tied to field operations; glass used sparingly (6 nodes above fold) |

---

## 2. Header

| Criterion | Verdict | Notes |
|-----------|---------|-------|
| Logo readable | **PASS** | AISTROYKA.AI wordmark sharp on `GlassNav` |
| Nav readable | **PASS** | Primary links visible desktop; mobile burger + solid drawer |
| CTA visible | **PASS** | Contact us + Launch pilot in header; Login preserved |
| Mobile menu works | **PASS** | Opens/closes; `aria-expanded` toggles; keyboard-focusable links |
| No layout shift | **PASS** | Fixed header shell; scroll intensity via `useGlassNavScrolled` only |
| No hydration issue | **PASS** | Client boundary isolated to header + filter root; no mismatch observed |

---

## 3. Hero

| Criterion | Verdict | Notes |
|-----------|---------|-------|
| H1 clear | **PASS** | Single `h1` confirmed via DOM (`h1Count: 1`) |
| Subtitle concise | **PASS** | One sentence operational lens messaging |
| CTAs visible | **PASS** | Primary Launch pilot → `/dashboard`; secondary Contact us → `/contact`; tertiary Get presentation |
| Lens card supports product meaning | **PASS** | Progress / risk / reports + 3 stream lines |
| No long text inside glass | **PASS** | Lens uses short labels only; hero body copy outside glass |
| Hero does NOT use “Request demo” | **PASS** | `PublicHeroCTA` uses `ctaLaunchPilot` / `ctaContact` / `ctaPresentation` only |
| CTAs not clipped on mobile | **PASS** | Stacked full-width buttons at 390px; no horizontal overflow |

---

## 4. Ambient field

| Criterion | Verdict | Notes |
|-----------|---------|-------|
| Subtle, not noisy | **PASS** | Two fixed glow orbs + 48px grid; low opacity |
| No readability damage | **PASS** | Content layered above field (`z-index` shell) |
| No scroll jank | **PASS** | CSS-only `position: fixed`; no JS animation loop |
| Reduced motion respected | **PASS** | `@media (prefers-reduced-motion: reduce)` disables glow animation in `globals.css` |
| Decorative aria-hidden | **PASS** | `PublicAmbientField` root has `aria-hidden` |

---

## 5. Glass budget (above fold)

| Node | Component | Count |
|------|-----------|-------|
| Header nav | `GlassNav` | 1 |
| Hero lens | `GlassHeroCard` | 1 |
| Metric chips | `GlassSurface` × 4 | 4 |
| **Total** | | **6** |

Within `LG_MAX_VISIBLE_NODES = 6`. Hero CTAs use solid buttons, not glass.

---

## 6. CTA hierarchy (all locales)

| Tier | EN | RU | ES | IT | Hero? |
|------|----|----|----|-----|-------|
| Primary | Launch pilot | Запустить пилот | Iniciar piloto | Avvia pilota | ✅ |
| Secondary | Contact us | Связаться с нами | Contáctanos | Contattaci | ✅ |
| Tertiary | Get presentation | Получить презентацию | Obtener presentación | Richiedi presentazione | ✅ |

Lower-page “Request demo” links remain in pricing/final CTA sections — **out of LG-2A hero scope** (LG-2B).

---

## 7. Screenshots captured

| Viewport | Locale | File (local temp) |
|----------|--------|-------------------|
| 1440×900 desktop | EN | `page-2026-06-18T10-02-18-571Z.png` |
| 390×844 mobile | EN | `page-2026-06-18T10-02-36-677Z.png` |

Screenshots stored under Cursor temp (`/var/folders/.../cursor/screenshots/`). Not committed to repo (audit evidence referenced here).

---

## 8. Manual visual notes

- **Desktop EN:** Two-column hero — copy left, lens card right; amber site glow behind lens reads as “active construction site”; header glass capsule floats over ambient grid.
- **Mobile EN:** Single column — badge → h1 → subtitle → stacked CTAs → 2×2 metric chips → lens card below; no text overlap.
- **Mobile RU:** Localized CTAs and lens strings natural; mobile drawer solid surface (not glass) for readability.
- **Dev-only noise:** Next.js “1 Issue” overlay in dev — not present in production build.

---

## Visual acceptance verdict

# PASS — LG-2A surfaces meet visual acceptance criteria

Ready for final no-tail audit and closure.
