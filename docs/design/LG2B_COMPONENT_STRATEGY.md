# LG-2B Component Strategy

**Date:** 2026-06-18  
**Status:** Architecture only — **no implementation in this phase**  
**Prerequisite:** LG-2A components (`PublicHeroCTA`, `PublicHeroLens`, `PublicHeroMetrics`, shell layout)

---

## 1. Design principle

> **One hero system, many variants — not one bespoke hero per page.**

LG-2A homepage keeps its **unique** lens hero (`PublicHeroLens` + metrics) as the brand signature. All other marketing pages use a shared **`PublicPageHero`** with configurable variants. Visual consistency comes from shared spacing, typography, and section rhythm — not from copying the homepage lens layout.

---

## 2. Proposed shared components

Location (planned): `apps/web/components/public/`  
Glass imports (planned): `@/components/design/liquid-glass` only

### 2.1 `PublicPageHero`

**Purpose:** Standard page opener for all LG-2B pages.

**Variants (enum):**

| Variant | Use on | Layout | Glass |
|---------|--------|--------|-------|
| `compact` | about, faq, security, legal-adjacent | Left-aligned h1 + lede + optional badge | Optional 0–1 `GlassSurface` badge only |
| `centered` | copilot, enterprise, workflows, api | Centered h1 + subtitle | 0 glass in text block |
| `split-visual` | platform, mobile | Copy left + **one** visual slot right | **1×** `GlassHeroCard` or device frame (not full homepage lens) |
| `conversion` | contact | Short h1 + trust line; form below fold | 0 glass on form |

**Props (conceptual):**

```tsx
type PublicPageHeroProps = {
  badge?: string;
  title: string;
  subtitle: string;
  variant: "compact" | "centered" | "split-visual" | "conversion";
  visual?: React.ReactNode; // split-visual only
  ctas?: PublicCtaBundle;   // optional inline CTAs
};
```

**Do NOT:** Copy `PublicHomeContent` hero markup into each page.

---

### 2.2 `PublicFeatureGrid`

**Purpose:** Replace repeated card loops (platform, mobile, about, features, solutions, security, ai-control).

**Structure:**

- Section title + optional subtitle
- Responsive grid (`1 → 2 → 3/4 cols`)
- Uses `PublicFeatureCard` children

**Glass:** **Forbidden** on grid container. Optional **1×** glass highlight card per section (flagship module only).

---

### 2.3 `PublicFeatureCard`

**Purpose:** Single feature/module/FAQ-adjacent card primitive.

**Variants:**

| Variant | Surface | Use |
|---------|---------|-----|
| `solid` (default) | `bg-aistroyka-surface` + border | Most cards |
| `highlight` | Optional `GlassSurface` intensity `subtle` | One flagship item per page max |
| `faq` | Solid; `dt`/`dd` semantics | FAQ items |

**Props:** `title`, `body`, optional `href`, optional `iconKey`

---

### 2.4 `PublicCTASection`

**Purpose:** Unified bottom-of-page (and optional mid-page) conversion band.

**Reuses:** `PublicHeroCTA` internally (already LG-2A).

**Variants:**

| Variant | Layout |
|---------|--------|
| `band` | Full-width section; solid or subtle gradient background |
| `floating` | Optional `GlassPanel` capsule — **1 glass node max** |
| `inline` | Row under hero (copilot/platform) |

**Mandatory on:** Every LG-2B.1–2B.6 page at least once in `band` variant.

**CTA bundle (fixed hierarchy):**

1. Primary → `/dashboard` — `public.home.ctaLaunchPilot` (or shared `public.cta.launchPilot`)
2. Secondary → `/contact` — `public.home.ctaContact`
3. Tertiary → `/contact` — `public.home.ctaPresentation`

---

### 2.5 `PublicProofSection`

**Purpose:** Trust, metrics, logos, case snippets — **without duplicating homepage hero metrics**.

**Variants:**

- `trust-line` — single sentence (home trust strip style)
- `stat-row` — max 3 stats, **solid** typography (no glass chips)
- `case-snippet` — 1–2 case cards linking to `/cases/[slug]`

**Use on:** platform (social proof), about (reliability), contact (trust near form)

**Forbidden:** Reusing `PublicHeroMetrics` mock numbers off homepage.

---

### 2.6 `PublicTimelineSection`

**Purpose:** Phased stories (implementation page, optional platform rollout).

**Surface:** Solid stepped list — **no glass** on steps (long text).

**Use on:** `/implementation` (phase 2); optional condensed version on `/platform` (“How teams adopt”)

---

## 3. Reuse map from LG-2A

| LG-2A component | LG-2B reuse |
|-----------------|-------------|
| `PublicHeroCTA` | Inside `PublicCTASection` and optional `PublicPageHero` |
| `PublicHeroLens` | **Homepage only** — do not import on other pages |
| `PublicHeroMetrics` | **Homepage only** — other pages use `PublicProofSection` stat-row |
| `PublicAmbientField` | Layout — unchanged |
| `PublicLiquidGlassRoot` | Layout — unchanged |
| `PublicHeader` / `GlassNav` | Unchanged |
| `GlassHeroCard` | Max 1× per non-home page in `split-visual` hero only |
| `GlassSurface` | Max 2× per page in feature highlight + optional floating CTA |
| `GlassPanel` | Floating CTA band only |

---

## 4. Page → component mapping (LG-2B.1–2B.6)

| Page | PublicPageHero | PublicFeatureGrid | PublicCTASection | PublicProofSection | PublicTimelineSection | Local only |
|------|----------------|-------------------|------------------|--------------------|-----------------------|------------|
| **Platform** | `split-visual` | 5 modules + cross-links | `band` | `trust-line` | optional mini | — |
| **Mobile** | `split-visual` | 4 workflows | `band` | store-neutral note | — | device frame slot |
| **Copilot** | `centered` | capabilities + patterns | `band` + hero inline | — | — | `CopilotMockUI` |
| **About** | `compact` | 4 narrative cards | `band` | `trust-line` | — | — |
| **FAQ** | `compact` | faq variant cards | `band` | — | — | — |
| **Contact** | `conversion` | — | — (form is CTA) | `trust-line` | — | `ContactForm` |

---

## 5. i18n strategy

Introduce shared keys (planned):

```
public.cta.launchPilot
public.cta.contactUs
public.cta.presentation
public.section.learnMore
```

Page-specific content stays in `public.{platform,mobile,copilot,...}`.

**Rule:** Hero `subtitle` must differ from `metaDescription` after rewrite pass.

---

## 6. File plan (implementation phase — not now)

```
components/public/
  PublicPageHero.tsx          (new)
  PublicFeatureGrid.tsx       (new)
  PublicFeatureCard.tsx       (new)
  PublicCTASection.tsx        (new)
  PublicProofSection.tsx      (new)
  PublicTimelineSection.tsx   (new)
  PublicHeroCTA.tsx           (existing — reuse)
  index.ts                    (extend exports)
```

**Do not create** `components/public/liquid-glass/` or duplicate design primitives.

---

## 7. Anti-patterns (explicit ban)

| Anti-pattern | Why |
|--------------|-----|
| Unique hero component per route | Six different styles guaranteed |
| Glass on FAQ answers | Readability failure |
| Glass grid of 8+ cards | Budget + GPU violation |
| Copy homepage lens to `/copilot` | AI story collision with home |
| Inline card markup after LG-2B.1 | Regression to pre-template state |

---

## 8. Acceptance criteria (for LG-2B implementation)

- [ ] All 2B.1–2B.6 pages use `PublicPageHero` + `PublicCTASection`
- [ ] No page imports `PublicHeroLens` except homepage
- [ ] Glass node count ≤ 6 per viewport on every page
- [ ] Card grids use `PublicFeatureGrid` — no raw `.map` card divs in page files
- [ ] CTA hierarchy matches `LG2B_CTA_ARCHITECTURE.md`
