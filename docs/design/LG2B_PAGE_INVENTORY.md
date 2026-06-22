# LG-2B Page Inventory

**Date:** 2026-06-18  
**Prerequisite:** LG-2A committed (`a59a014b` — public shell, header, homepage hero)  
**Scope:** Remaining public marketing routes under `app/[locale]/(public)/`  
**Out of scope:** Dashboard, auth, admin, API backend, mobile apps

---

## Global shell (already LG-2A)

All public pages inherit:

| Layer | Component | Glass |
|-------|-----------|-------|
| Layout | `PublicAmbientField` | No (CSS glow only) |
| Layout | `PublicLiquidGlassRoot` → `LiquidGlassFilter` | Filter mount (1×) |
| Header | `PublicHeader` → `GlassNav` | 1× glass nav |
| Footer | `PublicFooter` | No glass (LG-2B policy: keep solid) |

Homepage (`/`) hero is **LG-2A complete** — not in LG-2B body scope except optional dedupe of lower sections.

---

## Priority LG-2B pages (mandated implementation order)

| # | Route | File | Purpose | Target user | Current sections | Current CTA | Homepage duplication | Complexity | Risk |
|---|-------|------|---------|-------------|------------------|-------------|----------------------|------------|------|
| **2B.1** | `/platform` | `platform/page.tsx` | Product stack overview: web, manager app, worker app, AI engine, integrations | GC / ops director evaluating platform fit | H1 + intro; 5 stacked cards | **None** | Overlaps home “Key modules” + platform items in nav story; `/features` is superset | **Medium** — needs hub hero + module grid + outbound links | **Medium** — must not become second homepage |
| **2B.2** | `/mobile` | `mobile/page.tsx` | Field mobile apps: manager + worker workflows | Site managers, field supervisors, workers | H1 + intro; 4 cards | **None** | Home has mobile teaser section linking here; content partially duplicated | **Medium** — needs device/workflow visual, store-neutral CTAs | **Low–Medium** — iOS-primary product contour; avoid Android scope creep |
| **2B.3** | `/copilot` | `copilot/page.tsx` + `CopilotMockUI.tsx` | AI copilot intelligence layer marketing | PM, superintendent, ops lead | Hero; capabilities (7); patterns (5); mock UI; human-in-the-loop | `/contact` → `ctaDemo`; `/platform` → `ctaPlatform` | Overlaps home AI section + `/ai-construction-control` narrative | **High** — richest page; mock UI + many sections | **High** — easy to over-glass or duplicate AI story |
| **2B.4** | `/about` | `about/page.tsx` | Company mission, market problem, reliability | Investor, partner, enterprise buyer | H1 + intro; 4 narrative cards | **None** | Partial overlap with home pain/solution copy tone | **Low** — card stack template | **Low** |
| **2B.5** | `/faq` | `faq/page.tsx` | Objection handling, product FAQ | Evaluator mid-funnel | H1 + intro; 5 Q&A cards (`dl`) | **None** | Answers repeat home/platform/mobile/pricing themes | **Low** — accordion-friendly | **Medium** — long answers must stay **non-glass** |
| **2B.6** | `/contact` | `contact/page.tsx` + `ContactForm.tsx` | Lead capture / conversion | Ready-to-buy lead | H1; form; demo info block | Form submit → `public.form.send` | Home final CTA also → `/contact` with “Request Demo” label | **Medium** — form UX + conversion polish | **High** — conversion surface; must align CTA hierarchy |

---

## Extended marketing routes (LG-2B phase 2 — after 2B.1–2B.6)

| Route | Purpose | Target user | Current sections | Current CTA | Homepage duplication | Complexity | Risk |
|-------|---------|-------------|------------------|-------------|----------------------|------------|------|
| `/` (below hero) | Funnel hub | All | Metrics, trust, pain, solution, modules, roles, AI/mobile/pricing teasers, final CTA | Mixed (`Launch pilot` hero; `Request Demo` lower) | Self | **Medium** (dedupe only) | **Medium** — metrics dup P3 from LG-2A |
| `/features` | Full feature catalog | Evaluator | H1 + 8-feature grid | None | Home modules = 4/8 subset | Low | Low |
| `/solutions` | Role-based solutions | Role buyers | H1 + 5 role cards | None | Home roles = 3/5 subset | Low | Low |
| `/pricing` | Plans matrix | Buyer | H1 + 4 plans × 2 CTAs | `/contact` → `requestQuote`, `bookDemo` | Home pricing teaser | Medium | Medium — commercial copy |
| `/enterprise` | Enterprise pitch | Enterprise buyer | Hero; capabilities (8); readiness (4); CTA row | `/contact` → `ctaSales`, `ctaDemo` | None direct | Medium | Medium |
| `/ai-construction-control` | AI control deep dive | Technical evaluator | H1 + 5 cards | None | Home AI section teaser | Medium | **High** — overlaps `/copilot` |
| `/ai-demo` | Interactive AI demo | Technical evaluator | Hero; `#demo` simulator; capabilities | `#demo` anchor | Overlaps copilot/ai-control | **High** (interactive) | Medium |
| `/workflows` | Workflow automation story | Ops / IT | Hero; examples; benefits; CTA | `/contact` → `requestDemo` | None | Medium | Low |
| `/integrations` | Integration catalog | IT / ops | Hero; categories; architecture; CTAs | `/contact` ×2 | Platform card mentions integrations | Medium | Low |
| `/api` | API developer marketing | Developer | Hero; available list; DX; code mock | `/contact` ×2 | None | Medium | Low |
| `/security` | Trust / security | Enterprise / IT | H1 + 5 cards | None | None | Low | Low |
| `/implementation` | Implementation phases | Enterprise buyer | Hero; phases; duration; CTAs | `/contact` ×2 | None | Medium | Low |
| `/partners` | Partner program | Partner | Hero; types; benefits; CTA | `/contact` | None | Low | Low |
| `/cases` | Case study index | Evaluator | H1 + 4 cards → slugs | Card links only | None | Low | Low |
| `/cases/[slug]` | Case detail | Evaluator | Back link; metadata dl | Back to index | None | Low | Low |
| `/docs` | Docs index | User / admin | H1 + 7 links | Doc slugs | None | Low | Low |
| `/docs/[slug]` | Doc article | User / admin | Back link; body | Back | None | Low | Low |
| `/projects-showcase` | Visual showcase | Evaluator | H1 + 4 placeholder cards | None | None | Low | Low |
| `/privacy` | Legal | All | Prose sections | None | None | Low | Low |
| `/terms` | Legal | All | Prose sections | None | None | Low | Low |

---

## Page pattern taxonomy (current code)

| Pattern | Pages | LG-2B treatment |
|---------|-------|-----------------|
| **A — Catalog stack** | platform, mobile, about, features, security, solutions, ai-construction-control | → `PublicPageHero` + `PublicFeatureGrid` |
| **B — Hero + grids + contact CTAs** | copilot, enterprise, implementation, integrations, partners, workflows, api | → `PublicPageHero` + grids + `PublicCTASection` |
| **C — Interactive** | copilot (mock), ai-demo (simulator), contact (form) | Keep local components; wrap in shared shell sections |
| **D — Index → slug** | cases, docs | Light polish; minimal glass |
| **E — Legal prose** | privacy, terms | No glass; typography only |
| **F — Pricing matrix** | pricing | Solid cards; glass CTA band only |

---

## Hardcoded English (fix in LG-2B phase 2)

| Page | Strings |
|------|---------|
| `/api` | `"Code examples (mock)"` |
| `/enterprise` | `"Enterprise capabilities"`, `"Enterprise readiness"` |
| `/implementation` | `"Phases"` |
| `/integrations` | `"Integration categories"` |
| `/partners` | `"Partner types"`, `"Benefits"` |

---

## Complexity legend

| Level | Meaning |
|-------|---------|
| **Low** | Single template swap; no new interaction |
| **Medium** | New shared components + i18n + layout variants |
| **High** | Custom visual (mock UI, simulator, form) + strict glass budget |

## Risk legend

| Level | Meaning |
|-------|---------|
| **Low** | Isolated page; limited funnel impact |
| **Medium** | Overlap with homepage or peer pages; copy drift risk |
| **High** | Conversion or AI narrative confusion if redesigned without IA guardrails |
