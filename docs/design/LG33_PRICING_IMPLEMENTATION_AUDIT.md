# LG-3.3 Pricing — Implementation Audit

**Date:** 2026-06-18  
**Route:** `/[locale]/pricing`  
**Branch:** `design/liquid-glass-public-shell-lg2a` (uncommitted)

---

## 1. Files changed

| File | Change |
|------|--------|
| `apps/web/app/[locale]/(public)/pricing/page.tsx` | Full redesign — shared public components |
| `apps/web/app/[locale]/(public)/PublicHomeContent.tsx` | Pricing teaser CTA uses `pricingTeaserCta` |
| `apps/web/messages/en.json` | `public.pricing.*` rewrite + home teaser |
| `apps/web/messages/ru.json` | Parity |
| `apps/web/messages/es.json` | Parity |
| `apps/web/messages/it.json` | Parity |

---

## 2. Sections implemented

| Spec section | Component | Status |
|--------------|-----------|--------|
| A. Hero | `PublicPageHero` variant=`compact`, `ctas={false}` | ✅ |
| B. Engagement models | `PublicFeatureGrid` 2-col, pilot=`glass-highlight` | ✅ |
| C. What's included | `PublicFeatureGrid` 3-col, solid tiles + product links | ✅ |
| D. Commercial process | `PublicTimelineSection` 5 steps | ✅ |
| E. Trust / readiness | `PublicProofSection` variant=`stat-row`, qualitative values | ✅ |
| F. Related pages | Solid card grid (Platform, Features, Contact, Enterprise) | ✅ |
| G. CTA | `PublicCTASection` variant=`floating`, `public.cta.*` | ✅ |

---

## 3. Ownership verification

| Check | Result |
|-------|--------|
| Pricing answers commercial packaging | ✅ Engagement models + process + inclusions |
| No enterprise capability deep-dive | ✅ Enterprise evaluation links to `/enterprise` |
| No platform stack map | ✅ Related link only |
| No AI pipeline | ✅ Construction AI tile links to `/ai-construction-control` |
| No contact form | ✅ Related link + footer CTA to `/contact` |
| No fake tier cards | ✅ Removed |

---

## 4. Engagement model routing

| Model | href | Rationale |
|-------|------|-----------|
| Pilot | `/dashboard` | Pilot-first entry |
| Project rollout | `/contact` | Scoped commercial discussion |
| Multi-project | `/contact` | Custom deployment scope |
| Enterprise evaluation | `/enterprise` | Readiness topics on Enterprise page |

---

## 5. Glass budget

| Node | Count |
|------|-------|
| GlassNav (layout) | 1 |
| Pilot engagement `glass-highlight` | 1 |
| Floating `PublicCTASection` | 1 |
| **Total** | **3** ✅ |

---

## 6. i18n implementation

| Namespace | Keys (approx.) | Locales |
|-----------|----------------|---------|
| `public.pricing.*` | ~67 leaf keys | EN, RU, ES, IT |
| `public.home.pricingTeaser*` | 3 keys updated | EN, RU, ES, IT |
| Dead tier keys removed | 9 keys | All locales |

**Tail fix:** `includedCopilotDesc` — removed "engagement tier" wording (EN/RU) to avoid implying public SKU tiers.

---

## 7. Demo-language audit

| Pattern | `/pricing` | Marketing grep |
|---------|------------|----------------|
| Request Demo | Absent | Absent |
| Book Demo | Absent | Absent |
| Schedule Demo | Absent | Absent |
| Enterprise Demo | Absent | Absent |
| `requestQuote` | Removed | N/A |

---

## 8. Accessibility notes

| Item | Status |
|------|--------|
| Single h1 via `PublicPageHero` | ✅ |
| Section headings with `aria-labelledby` on trust + related | ✅ |
| Focus rings on related links | ✅ `linkFocusClass` |
| Metadata from i18n | ✅ `generateMetadata` |

---

## 9. Implementation verdict

Pricing page matches LG-3.3 IA spec. Ownership boundaries enforced via engagement framing and outbound links.
