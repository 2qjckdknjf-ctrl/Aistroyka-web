# LG-3.2 Features — Scope Audit

**Date:** 2026-06-18  
**Phase:** LG-3.2 — Architecture audit only  
**Companion:** `LG32_FEATURES_BOUNDARY_AUDIT.md`  
**Route:** `/features`  
**Code entry:** `apps/web/app/[locale]/(public)/features/page.tsx`

---

## 1. Scope definition

### 1.1 In scope (LG-3.2 audit)

- Current `/features` inventory
- Ownership vs Home, Platform, Mobile, Copilot, AI Control, About, FAQ, Contact
- Features vs Platform hypothesis validation
- Duplication and CTA classification
- IA / glass **recommendations** (no implementation)

### 1.2 Out of scope

- Page redesign / component work
- `/solutions` role matrix (related but separate canonical page)
- `/integrations` / `/api` page refactors
- Homepage module dedupe execution (noted as dependency)
- Dashboard product behavior

---

## 2. Page inventory

| Property | Value |
|----------|-------|
| **Locales** | en, ru, es, it |
| **Namespace** | `public.features` |
| **Leaf keys (EN)** | 17 |
| **Components** | None from `@/components/public` |
| **Glass** | None |
| **Sitemap** | Listed |
| **Nav** | Primary (`PublicHeader`) + footer |

### 2.1 Inbound links

| Source | Link type |
|--------|-----------|
| Header primary nav | Direct |
| Footer | Direct |
| Homepage | ❌ No dedicated CTA today (modules inline only) |
| Platform | ❌ No outbound link from platform page body |

### 2.2 Outbound links

| Target | Present today |
|--------|---------------|
| Platform, Mobile, AI Control, Copilot, Integrations | ❌ |
| Contact / dashboard | ❌ (no CTA) |

**Implementation should add** catalog cross-links — not peer page rewrites.

---

## 3. Content scope map (current keys)

```
public.features
├── title                 → h1
├── metaDescription       → body lede (should be SEO-only)
├── projectManagement (+Desc)
├── tasks (+Desc)
├── dailyReports (+Desc)
├── photoVideo (+Desc)
├── aiAnalytics (+Desc)   ⚠ split in implementation
├── teamRoles (+Desc)
├── dashboards (+Desc)
└── integrations (+Desc)
```

### 3.1 Keys needed for LG-3.2 implementation (recommended)

| Group | Est. keys | Purpose |
|-------|-----------|---------|
| Hero | 5–7 | eyebrow, heroTitle, heroSubtitle, metaDescription |
| Group headings | 6–8 | 3–4 group titles + subtitles |
| Catalog tiles | 24–36 | 8–12 tiles × title/desc (+ optional href labels) |
| Cross-links | 8–12 | platform, mobile, ai control, copilot, integrations |
| Footer CTA | 2 | ctaTitle, ctaSubtitle |
| **Total target** | **~45–60** | Align with LG-2B/LG-3.1 page depth |

**Proposed tile split (implementation):**

| Current key | Future treatment |
|-------------|------------------|
| `projectManagement`, `tasks` | Core ops group — KEEP |
| `dailyReports`, `photoVideo` | Field group — REWRITE + link Mobile |
| `aiAnalytics` | **SPLIT** → `featConstructionAi` + `featCopilot` (or similar) |
| `teamRoles`, `dashboards` | Team & insights groups — KEEP |
| `integrations` | Connect group — KEEP + link Integrations |

---

## 4. Platform vs Features scope split

| Belongs **only** on Platform | Belongs **only** on Features |
|------------------------------|------------------------------|
| Stack visual (web / mobile / AI / notify layers) | Per-module tiles (tasks, reports, photos as separate items) |
| 6 strategic capability pillars | 3–4 **category** sections with granular tiles |
| End-to-end timeline (workers → visibility) | No workflow steps |
| Owner visibility pillar (customer-safe) | Dashboards & metrics as explicit module |
| Platform proof stats | Integration **readiness** as catalog item (not vendor list) |
| “How it works” narrative | “What’s included” narrative |

**Shared boundary:** Both may mention “daily reports” — Platform one line inside Field reporting cap; Features full tile with link to Mobile.

---

## 5. Peer page scope boundaries

| Peer | Features must NOT absorb | Features may reference |
|------|--------------------------|----------------------|
| **Home** | Outcome hero, pain/solution | “Full catalog” link target |
| **Platform** | Stack fit, timeline, 6-cap rewrite | “See how modules connect” |
| **Mobile** | Start work, inbox, approve UX | “Field capture feeds these modules” |
| **AI Control** | Analysis pipeline, detection grid | Construction AI catalog tile → link |
| **Copilot** | Ask/answer, guardrails grid | Copilot catalog tile → link |
| **About / FAQ / Contact** | Mission, Q&A, form | Footer CTA only |

---

## 6. CTA scope

| Check | Today | Target |
|-------|-------|--------|
| Request Demo on page | ❌ | Stay absent |
| Footer `PublicCTASection` | ❌ | Required |
| `public.cta.*` | ❌ | Required |

---

## 7. Visual scope (architecture)

| Layer | LG-3.2 implementation target |
|-------|------------------------------|
| Hero | `PublicPageHero` compact/centered — solid |
| Body | 3–4 × `PublicFeatureGrid` — mostly solid |
| Highlight | ≤1 `glass-highlight` tile sitewide on page |
| Cross-links | Solid link cards |
| Footer | `PublicCTASection` floating |
| Glass max | 3 incl. nav (see boundary audit) |

**Forbidden:** `PublicHeroLens`, platform stack visual clone, Copilot mock, AI pipeline timeline on Features page.

---

## 8. Duplication summary

| Class | Count | Examples |
|-------|-------|----------|
| **KEEP** | 2 | Integrations tile; team/dashboard granularity |
| **MERGE** | 2 | Home 4 modules → features catalog |
| **REMOVE** | 1 | metaDescription as body |
| **REWRITE** | 5 | Flat grid; aiAnalytics; field tiles; hero; add CTAs + groups |

---

## 9. Implementation readiness checklist

| # | Gate | Audit status |
|---|------|--------------|
| 1 | Ownership defined | ✅ |
| 2 | Platform vs Features split | ✅ |
| 3 | AI tile split plan | ✅ |
| 4 | CTA target known | ✅ |
| 5 | Glass budget known | ✅ |
| 6 | Component strategy | ✅ (`LG2B_COMPONENT_STRATEGY.md`) |
| 7 | i18n expansion plan | ✅ |
| 8 | Page code ready | ❌ legacy |

---

## 10. Verdict

# FEATURES READY

Architecture scope for `/features` is ready for LG-3.2 implementation. Audit phase complete; redesign deferred.

**Do not redesign in this phase.**  
**Do not commit.**
