# LG-2B Content Deduplication Audit

**Date:** 2026-06-18  
**Prerequisite:** LG-2A homepage hero committed  
**Goal:** One canonical message per funnel stage — avoid six stylistically different pages saying the same thing

Classification: **A** Keep · **B** Merge · **C** Remove · **D** Rewrite

---

## 1. Duplicated metrics

| Content | Locations | Class | Action |
|---------|-----------|-------|--------|
| Mock stats `500+ / 12K+ / 8K+ / 45K+` | Home hero chips (`PublicHeroMetrics`); home metrics strip (`public.homeMetrics`) | **B Merge** | Keep **hero glass chips only**; remove or replace lower strip with non-numeric trust/proof (LG-2B homepage tail polish or LG-2B.0 micro-pass) |
| Metric labels (projects monitored, etc.) | `public.homeMetrics.*` shared by hero + strip | **A Keep** | Single i18n namespace; one render path |

---

## 2. Duplicated benefits / modules

| Content | Locations | Class | Action |
|---------|-----------|-------|--------|
| Key modules (projects, tasks, reports, photo) | Home `modules.*`; `/features` (8 items, includes same 4) | **B Merge** | Home: **teaser only** (2 cards + “See all features”); `/features` = canonical module catalog |
| Platform stack items | Home implicit via teasers; `/platform` (5 cards); `/mobile` (apps subset) | **B Merge** | `/platform` = canonical stack map; home links out, no stack enumeration |
| Role-based value | Home 3 roles; `/solutions` 5 roles | **B Merge** | Home: 1-line + link to `/solutions`; `/solutions` = canonical role matrix |
| Pain / solution narrative | Home pain + solution sections; `/about` market problem | **D Rewrite** | Home: emotional hook (1 paragraph); `/about` = mission depth; do not copy-paste paragraphs |
| Trust strip | Home only | **A Keep** | Short; non-duplicative |

---

## 3. Duplicated AI messaging

| Content | Locations | Class | Action |
|---------|-----------|-------|--------|
| “AI construction control” headline story | Home hero (LG-2A); home AI section; `/ai-construction-control`; `/copilot` hero | **D Rewrite** | **Split IA:** Home = control outcome; `/ai-construction-control` = what AI analyzes; `/copilot` = conversational layer + patterns; no shared heroTitle strings |
| Human-in-the-loop | `/copilot` section; `/ai-construction-control` card | **B Merge** | One canonical paragraph in `public.aiShared.humanInTheLoop`; reference from both pages |
| Capabilities bullet lists | `/copilot` (7); `/ai-demo` (5); `/ai-construction-control` (5 cards) | **B Merge** | Define capability **tiers**: L1 teaser (home), L2 product (ai-control), L3 copilot-specific (patterns, chat) |
| Copilot mock UI | `/copilot` only | **A Keep** | Unique to copilot page |

---

## 4. Duplicated mobile messaging

| Content | Locations | Class | Action |
|---------|-----------|-------|--------|
| Mobile field story | Home mobile section; `/mobile` 4 cards; FAQ `mobile` Q&A; `/platform` manager/worker apps | **D Rewrite** | Home: one sentence + CTA; `/mobile` = workflow depth (reporting, tasks, offline); `/platform` = one-line cross-links to `/mobile` |
| Manager vs worker apps | `/platform`; `/mobile` | **B Merge** | `/mobile` owns app UX copy; `/platform` links without repeating descriptions |

---

## 5. Duplicated construction messaging

| Content | Locations | Class | Action |
|---------|-----------|-------|--------|
| “Construction without visibility” | Home pain section | **A Keep** | Home-only hook |
| Site / field operational lens | Home hero lens; copilot mock site context | **A Keep** | Same metaphor, different surfaces — OK if copy differs |
| Enterprise / security / compliance | `/enterprise`, `/security`, `/about` reliability | **B Merge** | Cross-link; do not restate same compliance bullets on all three |

---

## 6. Duplicated CTAs (label chaos)

| Label pattern | Locations | Class | Action |
|---------------|-----------|-------|--------|
| **Launch pilot** → `/dashboard` | Home hero only (LG-2A) | **A Keep** | Primary funnel CTA — propagate via `PublicCTASection` |
| **Contact us** → `/contact` | Header; home hero secondary | **A Keep** | Standard secondary |
| **Get presentation** → `/contact` | Home hero tertiary | **A Keep** | Standard tertiary |
| **Request Demo** / **Request demo** | Home final CTA; `/copilot`; `/enterprise`; `/workflows`; header key exists | **D Rewrite** | Map to hierarchy: replace hero-band “Request Demo” with **Contact us** or **Launch pilot** per context; reserve “demo” language for contact form intent field only |
| **Book demo** / **bookDemo** | `/pricing` | **D Rewrite** | Pricing cards → secondary **Contact us** + optional tertiary presentation |
| Plan-specific CTAs | `/pricing` (8 contact links) | **B Merge** | Single `PublicCTASection` at page bottom; plan cards link to `/contact?plan=` query if needed later |
| **Learn more** | Home → `/ai-construction-control` | **A Keep** | Teaser CTA — not a global conversion CTA |
| No CTA | platform, mobile, about, faq, features, solutions, security | **D Rewrite** | Add **`PublicCTASection`** footer band on every marketing page (mandated LG-2B) |

See `LG2B_CTA_ARCHITECTURE.md` for target hierarchy.

---

## 7. Duplicated page structure (not content)

| Pattern | Pages | Class | Action |
|---------|-------|-------|--------|
| Identical card stack markup | platform, mobile, about, features, security, solutions, ai-control | **B Merge** | Replace with `PublicFeatureGrid` + `PublicFeatureCard` |
| Identical hero block (h1 + metaDescription) | Most catalog pages | **B Merge** | `PublicPageHero` variants |
| Centered hero + dual CTAs | copilot, enterprise, api, … | **B Merge** | `PublicPageHero` + `PublicCTASection` |

---

## 8. Remove candidates

| Content | Class | Rationale |
|---------|-------|-----------|
| Home metrics strip (numeric) | **C Remove** | Duplicates hero chips; adds scroll fatigue |
| Repeated `metaDescription` as body intro on every page | **D Rewrite** (not remove) | Intro should be page-specific lede, not SEO duplicate |
| `/projects-showcase` placeholder cards | **C Remove** or **D Rewrite** | Placeholder images hurt trust — defer to LG-2C or hide until real assets |

---

## 9. Summary matrix

| Category | Keep | Merge | Remove | Rewrite |
|----------|------|-------|--------|---------|
| Metrics | 1 | 1 | 1 | 0 |
| Benefits / modules | 1 | 4 | 0 | 1 |
| AI messaging | 2 | 2 | 0 | 2 |
| Mobile messaging | 0 | 1 | 0 | 1 |
| Construction messaging | 2 | 1 | 0 | 0 |
| CTAs | 3 | 1 | 0 | 3 |
| Structure | 0 | 3 | 1 | 1 |
| **Totals** | **9** | **13** | **2** | **8** |

---

## 10. Content ownership (canonical source of truth)

| Topic | Canonical page | Home role |
|-------|----------------|-----------|
| Construction control promise | `/` hero | Full message |
| Platform stack | `/platform` | Link only |
| Field mobile workflow | `/mobile` | Teaser |
| AI analysis (photo/report) | `/ai-construction-control` | Teaser |
| AI copilot (chat/patterns) | `/copilot` | Mention + link |
| Features catalog | `/features` | 2-card teaser |
| Role solutions | `/solutions` | Link |
| Pricing | `/pricing` | Teaser |
| Company story | `/about` | None (footer link) |
| Objections | `/faq` | None |
| Conversion | `/contact` | CTA target |
