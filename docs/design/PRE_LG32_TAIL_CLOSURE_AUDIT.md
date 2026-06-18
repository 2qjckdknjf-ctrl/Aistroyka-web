# PRE-LG-3.2 Tail Closure Audit

**Date:** 2026-06-18  
**Scope:** Public marketing layer — final low-risk tail removal before LG-3.2 Features  
**Wave pages (modernized):** Home, Platform, Mobile, Copilot, About, FAQ, Contact, AI Construction Control  
**Out of scope:** LG-3.2 `/features` redesign (audit-only docs exist separately)

---

## Executive summary

Pre-LG-3.2 tail closure removed all sales-demo CTAs from the modernized wave and from low-risk legacy routes (workflows, pricing, enterprise). Canonical CTA architecture (`public.cta.*`) is now consistent. Navigation label drift (`AI Copilot` → `Copilot`) is fixed. Orphan i18n keys for demo CTAs and unused home hero CTAs were removed. All validation gates pass.

**Verdict:** **READY FOR LG-3.2**

---

## Task 1 — Request Demo eradication

### Modernized wave (must have zero sales-demo wording)

| Location | Before | Action | After |
|----------|--------|--------|-------|
| `public.aiControl.linkAiDemo` (en/ru/es/it) | "Try interactive demo" / locale variants | **REWRITE** | "Open mock analysis" / locale equivalents |
| `public.aiControl.relatedAiDemo` | "AI Demo" | **REWRITE** | "Interactive mock" / locale equivalents |
| Home, Platform, Mobile, Copilot, About, FAQ, Contact footer CTAs | Already `public.cta.*` | **KEEP** | No change |
| All other modernized page CTAs | Already canonical | **KEEP** | — |

### Legacy / phase-2 routes (low-risk fixes applied)

| Location | Before | Action | After |
|----------|--------|--------|-------|
| `workflows/page.tsx` | `public.nav.requestDemo` | **REWRITE** | `public.cta.contactUs` |
| `pricing/page.tsx` plan cards | `public.pricing.bookDemo` | **REWRITE** | `public.cta.getPresentation` |
| `pricing` metaDescription (4 locales) | "book a demo" / locale variants | **REWRITE** | "get a presentation" / locale equivalents |
| `enterprise/page.tsx` secondary CTA | `public.enterprise.ctaDemo` | **REWRITE** | `public.cta.getPresentation` |

### Documented KEEP (product route, not sales CTA)

| Location | Label | Rationale |
|----------|-------|-----------|
| `/ai-demo` route + `public.aiDemo.*` namespace | "AI Demo", "Try AI demo" | Dedicated interactive mock product surface — phase-2 route; not part of LG-2B wave |
| `public.nav.aiDemo` | "AI Demo" / "Demo IA" / "ИИ-демо" | Nav/footer link to product mock route — route name, not "Book demo" |
| `public.aiControl` href `/ai-demo` | Link retained | Points to mock simulator; visible copy no longer uses sales-demo phrasing |
| API comments (`/api/contact` "demo form") | Code comments only | Internal docs — no user-visible copy |
| Dashboard `demoSummary` keys | Dashboard namespace | Not public marketing |

### Removed i18n keys (zero references after fixes)

- `public.nav.requestDemo`
- `public.pricing.bookDemo`
- `public.enterprise.ctaDemo`

---

## Task 2 — CTA consistency

### Canonical trio (modernized wave)

| Tier | Key | Label (en) |
|------|-----|------------|
| Primary | `public.cta.launchPilot` | Launch pilot |
| Secondary | `public.cta.contactUs` | Contact us |
| Tertiary | `public.cta.getPresentation` | Get presentation |

### Modernized page verification

| Page | Hero CTA | Footer `PublicCTASection` | Status |
|------|----------|----------------------------|--------|
| Home | `PublicHeroCTA` → launchPilot / contactUs / getPresentation | `variant="band"` same trio | ✅ |
| Platform | Page hero optional; footer canonical | ✅ | ✅ |
| Mobile | Same pattern | ✅ | ✅ |
| Copilot | Same pattern | ✅ | ✅ |
| About | Same pattern | ✅ | ✅ |
| FAQ | Same pattern | ✅ | ✅ |
| Contact | Same pattern | ✅ | ✅ |
| AI Control | Same pattern | ✅ | ✅ |

### Deviations (documented, not blocking)

| Location | Deviation | Severity |
|----------|-----------|----------|
| Home pricing teaser | Button uses `pricingTeaserTitle` ("Pricing for every scale") not canonical trio | P3 — informational link to `/pricing` |
| Pricing plan cards | Primary card action = `requestQuote`; secondary = `getPresentation` | P3 — pricing-specific; no sales demo |
| Enterprise page | Primary = `ctaSales` ("Contact sales"); secondary = `getPresentation` | P3 — enterprise-specific primary label |
| Public header | Desktop: Contact us + Dashboard + Log in (no Launch pilot in nav chrome) | P3 — by design; pilot CTA on page bodies |

---

## Task 3 — Navigation consistency

### Target labels (en)

| Item | Expected | Before | After |
|------|----------|--------|-------|
| Construction AI | Construction AI | ✅ `public.nav.aiControl` | ✅ |
| Copilot | Copilot | AI Copilot / Copilot IA / ИИ-копилот | **Copilot** (all locales) |
| Platform | Platform | ✅ | ✅ |
| Mobile | Mobile | ✅ | ✅ |
| Features | Features | ✅ | ✅ |
| About | About | ✅ | ✅ |
| FAQ | FAQ | ✅ | ✅ |
| Contact | Contact | ✅ | ✅ |

### Other nav keys (unchanged, phase-2)

Pricing, Enterprise, Solutions, AI Demo, Workflows, etc. remain in secondary nav — not part of LG-2B primary IA but unchanged intentionally pending future waves.

---

## Task 4 — Dead i18n cleanup

### Removed (zero code references, safe)

| Key | Locales |
|-----|---------|
| `public.nav.requestDemo` | en, ru, es, it |
| `public.nav.launchPilot` | en, ru, es, it (duplicate of `public.cta.launchPilot`; never referenced from nav) |
| `public.nav.tryPlatform` | en, ru, es, it |
| `public.home.ctaLogin` | en, ru, es, it |
| `public.home.ctaTry` | en, ru, es, it |
| `public.pricing.bookDemo` | en, ru, es, it |
| `public.enterprise.ctaDemo` | en, ru, es, it |

### Kept (still referenced)

| Key | Used by |
|-----|---------|
| `public.nav.contactUs` | `PublicHeader` (duplicate label of `public.cta.contactUs` — intentional nav namespace) |
| `public.nav.aiDemo` | Header/footer link to `/ai-demo` |
| `public.aiDemo.*` | `/ai-demo` page |
| `public.pricing.requestQuote` | Pricing plan cards |
| `public.enterprise.ctaSales` | Enterprise primary CTA |

---

## Task 5 — Content overlap audit

| Overlap | Classification | Action |
|---------|----------------|--------|
| Home `modules*` ⊂ Features catalog | **MERGE** (future) | Document only — LG-3.2 scope |
| Home AI section teaser ↔ AI Control page | **KEEP** | Home links "Learn more"; intentional funnel |
| Home mobile teaser ↔ Mobile page | **KEEP** | Same |
| Platform 6-cap grid ↔ Features 8-card grid | **MERGE** (future) | LG-3.2 Features redesign |
| Copilot page ↔ AI Control "related Copilot" | **KEEP** | Cross-links by design |
| AI Control related links ↔ dedicated pages | **KEEP** | Deduped in LG-3.1 |

No page redesign performed in this closure pass.

---

## Task 6 — Glass governance recheck

Budget: **Home ≤ 6 nodes**; **other pages ≤ 4 nodes** (includes sticky `GlassNav`).

| Page | Glass nodes | Count | Status |
|------|-------------|-------|--------|
| Home | GlassNav + hero lens (`GlassHeroCard`) + 4 metric chips (`GlassSurface`) | 6 | ✅ at cap |
| Home final CTA | `variant="band"` — solid surface, not glass | — | ✅ |
| Platform | GlassNav + stack visual + 1 `glass-highlight` cap + floating CTA | 4 | ✅ |
| Mobile | GlassNav + hero visual + highlight + floating CTA | 4 | ✅ |
| Copilot | GlassNav + hero visual + highlight + floating CTA | 4 | ✅ |
| About | GlassNav + hero visual + highlight + floating CTA | 4 | ✅ |
| FAQ | GlassNav + hero visual + floating CTA | 3 | ✅ |
| Contact | GlassNav + hero visual + floating CTA | 3 | ✅ |
| AI Control | GlassNav + signal visual + highlight + floating CTA | 4 | ✅ |

No violations found; no fixes required.

---

## Task 7 — Accessibility recheck

| Check | Modernized wave | Status |
|-------|-----------------|--------|
| Single `h1` per page | `PublicPageHero` / home hero use one `h1`; section titles use `h2` | ✅ |
| Focus states | `PublicHeroCTA`, nav links, AI Control related links use `focus-visible:ring` | ✅ |
| CTA accessibility | `PublicCTASection` `aria-label`; touch min heights on mobile header CTAs | ✅ |
| Keyboard navigation | Header menu `aria-expanded` / `aria-controls`; FAQ accordion patterns unchanged | ✅ |
| Overflow | Public shells use `min-w-0`, `max-w-*`, `text-balance` / `text-pretty` | ✅ |

No safe fixes required beyond prior LG-2B / LG-3.1 work.

---

## Task 8 — Validation

Executed 2026-06-18 from repo root (`PATH=$HOME/.bun/bin:…`):

| Command | Result |
|---------|--------|
| `bun run check:design` (apps/web) | **PASS** |
| `bun run lint` | **PASS** |
| `bun x tsc --noEmit` (apps/web) | **PASS** |
| `bun run i18n:check` | **PASS** |
| `I18N_CHECK_ALL=1 bun run i18n:check` | **PASS** (2985 leaf keys) |
| `bun run build` | **PASS** |
| `bun run cf:build` | **PASS** |

---

## Task 9 — Fixes applied (file list)

| File | Change |
|------|--------|
| `apps/web/app/[locale]/(public)/workflows/page.tsx` | Demo CTA → `public.cta.contactUs` |
| `apps/web/app/[locale]/(public)/pricing/page.tsx` | `bookDemo` → `public.cta.getPresentation` |
| `apps/web/app/[locale]/(public)/enterprise/page.tsx` | `ctaDemo` → `public.cta.getPresentation` |
| `apps/web/messages/{en,ru,es,it}.json` | Demo key removal; AI Control mock link copy; nav Copilot label; pricing meta; orphan cleanup |

---

## Remaining risks (P3 only)

1. **`/ai-demo` product page** — still uses "AI Demo" product naming and `public.aiDemo` strings with "demo" in copy (phase-2 route).
2. **`/features` legacy page** — not modernized; overlaps with home/platform content (LG-3.2 target).
3. **Home pricing teaser button** — non-canonical label (informational).
4. **Enterprise hardcoded EN section headings** — "Enterprise capabilities" / "Enterprise readiness" not i18n'd.
5. **Header chrome** — no "Launch pilot" in sticky nav (by design; present on page CTAs).
6. **`public.nav.aiDemo`** — nav label retains "Demo" as product route name.

None block LG-3.2 Features implementation.

---

## Final verdict

**READY FOR LG-3.2**
