# LG-3.2 Features — Boundary Audit

**Date:** 2026-06-18  
**Phase:** LG-3.2 — Architecture audit only (**no page redesign**)  
**Branch:** `design/liquid-glass-public-shell-lg2a`  
**Route:** `/[locale]/features`  
**Prerequisite:** LG-3.1 AI Control closed (`6b7a6af7`)

---

## 1. Current state (`/features`)

### 1.1 Implementation snapshot

| Attribute | Current state |
|-----------|---------------|
| **File** | `apps/web/app/[locale]/(public)/features/page.tsx` |
| **Pattern** | Pre–LG-2B legacy: inline markup, no shared public components |
| **Layout** | Single column `max-w-4xl`, `py-16` shell |
| **i18n** | `public.features.*` (17 leaf keys, EN/RU/ES/IT parity) |
| **Glass** | None |
| **CTA** | **None** — conversion dead end |
| **Nav** | Primary nav (`PublicHeader` → `features`) + footer link |

### 1.2 Hero (de facto)

| Element | Source | Copy (EN) |
|---------|--------|-----------|
| **h1** | `public.features.title` | "Features" |
| **Intro** | `public.features.metaDescription` | "Project management, tasks, daily reports, AI analytics, and integrations for construction." |

**Issues:** SEO `metaDescription` reused as body; generic title; no eyebrow or catalog framing.

### 1.3 Sections

Single **8-card grid** (`sm:grid-cols-2`), no grouping, no cross-links:

| # | Key | Heading (EN) | Notes |
|---|-----|--------------|-------|
| 1 | `projectManagement` | Project management | ⊂ home `modules.projectManagement` |
| 2 | `tasks` | Tasks | ⊂ home modules |
| 3 | `dailyReports` | Daily reports | ⊂ home modules; overlaps Mobile |
| 4 | `photoVideo` | Photo & video evidence | ⊂ home modules; overlaps Mobile |
| 5 | `aiAnalytics` | AI analytics | Blurs AI Control + Copilot |
| 6 | `teamRoles` | Team roles & access | Overlaps Platform `capTeamCoordination` |
| 7 | `dashboards` | Dashboards & metrics | No dedicated deep page |
| 8 | `integrations` | Integration readiness | Overlaps `/integrations`, Platform stack |

**Visual language:** Legacy `.card` tokens — outside liquid-glass system. No `PublicPageHero`, `PublicFeatureGrid`, or `PublicCTASection`.

### 1.4 CTA structure

| Tier | Present? |
|------|----------|
| Launch pilot | ❌ |
| Contact us | ❌ |
| Get presentation | ❌ |
| Request Demo / Book Demo | ❌ (good) |
| Inbound links | Header nav, footer only — **no homepage deep link today** |

### 1.5 Overlap scan

| Peer | Overlap severity | Detail |
|------|------------------|--------|
| **Homepage** | **High** | First 4 features = home `modules.*` (same titles + near-identical Desc) |
| **Platform** | **High** | Platform 6-cap map subsumes same story at strategic level; Features is granular superset without differentiation |
| **Mobile** | **Medium** | `dailyReports`, `photoVideo` describe field artifacts, not capture workflow |
| **Copilot** | **Medium** | `aiAnalyticsDesc` implies assistant/risk story without boundary |
| **AI Control** | **Medium** | `aiAnalytics` duplicates intelligence-engine nouns without link or split |
| **About / FAQ / Contact** | **Low** | No direct copy collision |

---

## 2. Ownership decision

### 2.1 Canonical question

**"What product capabilities does AISTROYKA include — as a complete, browsable catalog?"**

### 2.2 Assigned ownership — `/features`

**UNIQUELY OWNS:**

| Domain | Scope |
|--------|--------|
| **Capability catalog** | Exhaustive module list at **feature granularity** (tasks, reports, photos, roles, dashboards, etc.) |
| **Category grouping** | Core ops · Field & evidence · AI · Team & access · Insights · Connect |
| **Capability one-liners** | What each module **is** — not how field UX works or AI pipeline depth |
| **Catalog cross-links** | Point to Platform (stack), Mobile, AI Control, Copilot, Integrations/API for depth |
| **Evaluator reference** | Mid-funnel “what’s in the box” page |

**DOES NOT OWN:**

| Topic | Canonical page |
|-------|----------------|
| How modules **fit together** (stack + flow) | `/platform` |
| Field capture / sync / review **workflow** | `/mobile` |
| Construction AI **analysis engine** depth | `/ai-construction-control` |
| Manager **assistant** workflow | `/copilot` |
| Product **outcome** promise | `/` homepage |
| Role-based **buyer** matrix | `/solutions` |
| Integration **vendor catalog** & status | `/integrations` |
| API developer DX | `/api` |
| Mission / trust narrative | `/about` |
| Objections | `/faq` |
| Pilot conversion | `/contact` |

### 2.3 Features vs Platform hypothesis

| Hypothesis | Verdict |
|------------|---------|
| **Platform** = how all modules fit together | ✅ **Validate** — stack visual, 6 strategic pillars, end-to-end timeline, owner visibility |
| **Features** = complete catalog of capabilities | ✅ **Validate with refinement** — must use **category grids + cross-links**, not a flat 8-card clone of platform themes |

**Refinement rule:** Platform cards = **strategic grouping** (6 areas). Features tiles = **granular modules** (8+ items in 3–4 groups). Never copy platform card titles verbatim into features tiles.

---

## 3. Content duplication audit

| Content | Also on | Class | Action (implementation) |
|---------|---------|-------|-------------------------|
| 4 core modules | Home `modules.*` | **MERGE** | Home: teaser + link to `/features`; Features = canonical catalog |
| 8 flat cards | Platform capability map (conceptual) | **REWRITE** | Group features; platform keeps stack narrative |
| `aiAnalytics` | AI Control, Copilot, docs, showcase | **REWRITE** | Split: Construction AI tile → `/ai-construction-control`; Copilot tile → `/copilot`; one-line each |
| `dailyReports` / `photoVideo` | Mobile workflow | **REWRITE** | Features: what exists; link to Mobile for how |
| `integrations` | `/integrations` page | **KEEP** on features | One catalog tile + link to integrations depth |
| `teamRoles` / `dashboards` | Platform coordination / web dashboard | **KEEP** | Features-only granularity; platform stays one-line |
| metaDescription as body | Many legacy pages | **REMOVE** | Dedicated `heroSubtitle` |
| Generic h1 "Features" | — | **REWRITE** | Catalog-framed hero title |

---

## 4. CTA audit

| Item | Location | Classification |
|------|----------|----------------|
| Request Demo | Not on `/features` | **KEEP** (absent) |
| Book Demo | Not on `/features` | **KEEP** (absent) |
| Missing conversion band | Page bottom | **REWRITE** → `PublicCTASection` + `public.cta.*` |
| Header Contact us | Shell | **KEEP** |

**Hierarchy violation today:** No footer CTA (**P1** for implementation per `LG2B_CTA_ARCHITECTURE.md`).

---

## 5. IA recommendation (architecture only — DO NOT IMPLEMENT)

### 5.1 Hero

| Property | Recommendation |
|----------|----------------|
| **Component** | `PublicPageHero` `variant="compact"` or `centered` |
| **Eyebrow** | e.g. "Product catalog" |
| **Title** | e.g. "Everything included in AISTROYKA" (distinct from Platform hero) |
| **Subtitle** | Dedicated lede — capability catalog, not stack story |
| **Visual** | Optional **solid** stat row (e.g. module count) — **not** homepage lens, **not** platform stack visual |
| **Hero CTAs** | `ctas={false}`; conversion in footer band |

### 5.2 Feature grouping strategy

| Group | Example tiles | Deep links |
|-------|---------------|------------|
| **Core project ops** | Projects, tasks, schedules, documents | Platform |
| **Field & evidence** | Daily reports, photo/video evidence | Mobile |
| **AI & intelligence** | Construction AI analysis, Copilot assistant | AI Control, Copilot |
| **Team & access** | Roles, permissions, notifications | Platform (coordination) |
| **Insights** | Dashboards, operational metrics | — |
| **Connect** | Integrations readiness, API | Integrations, API |

Use 2–4 × `PublicFeatureGrid` with `headingLevel="h2"` per group. At most **one** `glass-highlight` across entire page (e.g. Construction AI or Copilot tile).

### 5.3 Section structure

1. Hero — catalog promise  
2. Grouped capability grids (3–4 sections)  
3. Solid cross-link strip — Platform · Mobile · AI Control · Copilot · Integrations  
4. `PublicCTASection` `variant="floating"`

### 5.4 Cross-link strategy

Lightweight solid cards (same pattern as AI Control related links). **Do not** re-explain peer pages — one line + link each.

### 5.5 Glass budget

Per `LG2B_GLASS_GOVERNANCE.md`: **max 3 nodes** including layout `GlassNav`.

**Recommendation:** GlassNav + optional 1 highlight tile + floating CTA = **3**. All catalog prose solid.

---

## 6. Risks (for implementation)

| ID | Sev | Risk | Mitigation |
|----|-----|------|------------|
| R-01 | **P0** | Features page becomes second Platform (stack story) | Enforce catalog-only copy; link out for fit-together narrative |
| R-02 | **P0** | `aiAnalytics` tile blurs AI Control vs Copilot | Split into two tiles with distinct links and boundaries |
| R-03 | **P1** | No `PublicCTASection` | Add footer band in LG-3.2 implementation |
| R-04 | **P1** | Home 4-module grid duplicates catalog | Home teaser + "See all features" link (phase-2 homepage dedupe) |
| R-05 | **P1** | Platform 6-cap vs Features flat grid redundancy | Category grouping + explicit platform cross-link |
| R-06 | **P2** | Field features read like Mobile page | Frame as capabilities; link Mobile for workflow |
| R-07 | **P2** | metaDescription as body | Add `heroSubtitle` |
| R-08 | **P2** | Integrations tile vs `/integrations` page | Tile = readiness; page = vendor categories |
| R-09 | **P3** | Only 17 i18n keys | Expand to ~50–60 keys at implementation |
| R-10 | **P3** | Legacy `.card` markup | Use `PublicFeatureGrid` |

---

## 7. Boundary matrix (marketing layer)

| Page | Owns |
|------|------|
| **Homepage** | Outcome + teasers |
| **Platform** | Product **stack map** + how it works |
| **Features** | **Capability catalog** (granular modules) |
| **Mobile** | Field **workflow** |
| **AI Control** | Construction **intelligence engine** |
| **Copilot** | AI **assistant workflow** |
| **About** | Mission / trust |
| **FAQ** | Objections |
| **Contact** | Conversion |

---

## 8. Audit verdict

# FEATURES READY

Ownership and Features-vs-Platform split are **definable and consistent** with LG-2B/LG-3.1 architecture. Current page does not implement this (legacy grid, duplication, no CTA) — expected **LG-3.2 implementation** work, not an audit blocker.

**P0 blockers for architecture definition:** none  
**P1 items for next phase:** grouped catalog, split AI tiles, footer CTA, platform cross-link discipline

**Do not redesign in this phase.**  
**Do not commit.**
