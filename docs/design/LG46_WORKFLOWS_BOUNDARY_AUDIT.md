# LG-4.6 Workflows Boundary Audit

**Date:** 2026-06-19  
**Page:** `/[locale]/workflows`  
**Source:** `apps/web/app/[locale]/(public)/workflows/page.tsx`  
**Mode:** Audit only — no code changes

---

## Rule 2 — Clean room

`git status --short` at audit start: **DIRTY (STOP)**

| File | Bucket |
| --- | --- |
| `apps/web/app/[locale]/(public)/PublicHomeContent.tsx` | LG-4.5.1 |
| `apps/web/app/[locale]/(public)/api/page.tsx` | LG-4.5 |
| `apps/web/app/[locale]/(public)/contact/page.tsx` | LG-4.5.1 |
| `apps/web/app/[locale]/(public)/platform/page.tsx` | LG-4.5.1 |
| `apps/web/app/[locale]/(public)/workflows/page.tsx` | LG-4.5.1 |
| `apps/web/components/public/PublicCTASection.tsx` | LG-4.5.1 |
| `apps/web/components/public/PublicHeader.tsx` | LG-4.5.1 |
| `apps/web/components/public/PublicHeroCTA.tsx` | LG-4.5.1 |
| `apps/web/messages/{en,ru,es,it}.json` | LG-4.5 + LG-4.5.1 |
| `apps/web/lib/platform/public-api-inventory.ts` (+ test) | LG-4.5 |
| `docs/design/LG45_API_*.md` (5 files) | LG-4.5 |
| `docs/design/LG451_*.md` (2 files) | LG-4.5.1 |

**Unrelated:** none identified in dirty set.  
**Stash note:** continual-learning `AGENTS.md` may exist in `git stash` from prior session — not in current dirty list.

Audit proceeded on the **uncommitted release-candidate tree** (LG-4.5 + LG-4.5.1). Workflows page content reflects LG-4.5.1 honesty pass (partial/planned labels in examples).

---

## Phase A — Current page audit

### Primary question (today)

**What operational automation paths exist today vs planned — alerts, escalations, evidence follow-ups, and AI-triggered signals?**

Secondary questions the page partially answers:

- Which trigger → action chains are LIVE vs manual vs planned?
- Where do field capture, AI review, and rollout fit in workflow expansion?
- How should a pilot team map alerts and reviews to their sites?

### Canonical ownership

| Owns | Must NOT own |
| --- | --- |
| Automation **paths** and trigger→action **readiness** (LIVE/PARTIAL/PLANNED) | Full module catalog (Features) |
| Example operational chains (issue→notify, overdue→escalate, etc.) | Platform stack narrative (Platform) |
| Honest “not BPM” boundary | Enterprise governance evaluation (Enterprise) |
| Pilot scoping CTA for workflow expansion | Implementation phase detail (Implementation) |
| Links to AI, Mobile, Implementation for depth | Copilot assistant UX (Copilot) |
| | Photo-analysis pipeline depth (AI Control) |
| | Role-based entry cards (Solutions) |

### Current structure

| # | Section | Component / pattern | Content source |
| --- | --- | --- | --- |
| 0 | JSON-LD | `PublicJsonLd` | BreadcrumbList only |
| 1 | Hero | Plain `<section>` (centered) | `title`, `heroTitle`, `positioning` |
| 2 | Example paths | 5 bordered cards (`EXAMPLES`) | `ex1`–`ex5` with inline partial/planned qualifiers |
| 3 | Benefits | 2×2 grid (`BENEFITS`) | `b1`–`b4` — **no** LIVE/PARTIAL/PLANNED badges |
| 4 | Related links | `PublicRelatedLinksSection` | AI Control, Mobile, Implementation, Contact |
| 5 | CTA band | `PublicCTASection` variant `floating` | Launch pilot / Contact / Get presentation |

**Not present:** `PublicPageHero`, status matrix, timeline, proof section, inline hero CTAs, Platform/Features/Pricing links.

### CTAs

| CTA | Label key | Default href | testId |
| --- | --- | --- | --- |
| Primary | `public.cta.launchPilot` | `/dashboard` | `cta.public.workflows.primary` |
| Secondary | `public.cta.contactUs` | `/contact` | `cta.public.workflows.secondary` |
| Presentation | `public.cta.getPresentation` | `/contact` | `cta.public.workflows.presentation` |

Section copy: `ctaTitle`, `ctaSubtitle`.

### Metadata & SEO

| Field | Value (en) |
| --- | --- |
| `title` | Workflows |
| `metaDescription` | How alerts, escalations, evidence requests, and AI summaries **can connect** — automation engine expanding; **not full BPM today**. |
| Canonical | `buildPublicPageMetadata` → `/{locale}/workflows` |
| hreflang | en, ru, es, it via `alternates.languages` |
| Open Graph / Twitter | title + description from namespace |
| Breadcrumb JSON-LD | Home → Workflows |
| WebSite / Organization JSON-LD | From public layout only (not page-specific) |

Metadata is **unique** and appropriately hedged. Title is generic (“Workflows”) but not duplicated across routes.

### i18n usage

- Namespace: `public.workflows` (page copy) + `public.cta` + `public.layout` (breadcrumb home).
- Keys: 32 strings in `en.json` under `public.workflows`.
- **Parity:** keys exist in ru/es/it; **related block** (`relatedTitle` through `linkContact`) remains **English in ru/es/it** (LG-4.5.1 merge tail).

### Glass count

| Surface | Liquid Glass component | Count |
| --- | --- | --- |
| Page body sections | None (`aistroyka-surface` CSS tokens only) | 0 |
| Related link cards | Solid border cards | 0 |
| CTA band | `GlassPanel` inside `PublicCTASection` (`floating`) | **1** |
| Layout shell | `PublicLiquidGlassRoot` + ambient field (global) | n/a |

**Page-attributed glass budget: 1** (CTA only). Lowest glass depth among major LG public pages.

### Release inventory snapshot

| Field | Value |
| --- | --- |
| Owner | Operational automation paths (honest readiness) |
| Inbound (contextual) | **None** — only header, footer, sitemap |
| Inbound (global nav) | Header `SECONDARY_NAV`, Footer product links |
| Outbound | `/ai-construction-control`, `/mobile`, `/implementation`, `/contact` |
| CTA | Pilot → dashboard; Contact + presentation → contact |
| Metadata | Unique, hedged metaDescription |
| JSON-LD | BreadcrumbList only |
| Related links | 4 cards (see above) |
| Glass | 1 (`PublicCTASection`) |

---

## Phase C — Ownership audit vs peer pages

| Page | Primary question | Overlap with Workflows | Verdict |
| --- | --- | --- | --- |
| **Platform** | How do web, mobile, AI, approvals connect in one stack? | Timeline mentions notifications/approvals; `visualLayerNotify` | **REPOSITION** — Platform owns stack; Workflows owns **automation readiness matrix**, not stack diagram |
| **Features** | What modules are included? | `notificationsDesc`, documentation workflows | **KEEP boundary** — Features lists modules; Workflows shows **trigger chains** |
| **Mobile** | How do field teams capture evidence? | Field flows “feed” workflow paths | **KEEP** — complementary; related link appropriate |
| **AI Control** | How does Construction AI analyze evidence? | ex4 AI summary trigger | **KEEP** — Workflows references AI as **signal source**, not analysis depth |
| **Copilot** | How does the manager assistant help? | Summaries, guided actions | **REPOSITION** — link optional in related; do not duplicate Copilot UX |
| **Implementation** | How do teams adopt and roll out? | Rollout/adoption checkpoints | **KEEP** — Implementation owns **phases**; Workflows owns **automation catalog** |
| **Solutions** | How does each role enter the product? | Uses word “workflows” in meta | **KEEP** — Solutions = roles; Workflows = automation paths |
| **Enterprise** | Can a large org adopt? | `aiReviewWorkflows` governance card | **REPOSITION** — Enterprise owns org evaluation; not trigger catalog |

### Duplication findings

| Overlap | Severity | Action |
| --- | --- | --- |
| Platform timeline (Workers→Reports→Managers→AI→Decisions→Visibility) vs Workflows example paths | Medium | **REWRITE** Workflows to emphasize **automation status** and **rules engine gap**, not repeat stack story |
| Features “Notifications” module vs Workflows notify examples | Low | **KEEP** — cross-link Features in related links |
| Enterprise “Review workflows” vs ex3/ex4 | Low | **KEEP** — different audience; add Security link if enterprise funnel needed |
| Benefits b1–b4 vs example honesty | High (truth) | **REWRITE** — add LIVE/PARTIAL/PLANNED per benefit or merge into status matrix |

**Unique question Workflows should own (canonical):**

> **Which operational trigger→action paths are LIVE, PARTIAL, or PLANNED today — and what is explicitly not a BPM/rules engine yet?**

---

## Phase D — Navigation audit

### Inbound links

| Source | Links to `/workflows`? |
| --- | --- |
| Header `SECONDARY_NAV` | Yes |
| Footer product column | Yes |
| `sitemap.ts` | Yes |
| Home related links | **No** |
| Platform related links | **No** |
| Features related links | **No** |
| Implementation / Enterprise / Integrations | **No** |

**Finding:** Workflows is **nav-discoverable** but **not funnel-linked** from primary conversion pages. Orphan risk for SEO and IA depth.

### Outbound links

| Target | Present |
| --- | --- |
| AI Control | Related |
| Mobile | Related |
| Implementation | Related |
| Contact | Related + CTA |
| Platform | **Missing** |
| Features | **Missing** |
| Pricing | **Missing** |
| Security | **Missing** |
| Copilot | **Missing** |

### CTA paths

- Home → Platform → Features → Pricing → Contact: Workflows **not in** primary funnel (acceptable for secondary page) but should link **up** to Platform/Features.
- AI → AI Control → Mock → Contact: Workflows related to AI Control ✓; no `/ai-demo` link.
- Enterprise → Security → Implementation → Contact: Workflows links Implementation ✓; **no Security**.
- Integrations → API → Contact: **no path** from Workflows.

### Dead ends

Page is **not a dead end** (header, footer, related, CTA). **Weak hub:** missing canonical upstream links (Platform, Features) and commercial path (Pricing).

| ID | Severity | Finding |
| --- | --- | --- |
| NAV-W1 | P1 | No contextual inbound from Platform/Features/Home |
| NAV-W2 | P1 | Related links omit Platform, Features, Pricing |
| NAV-W3 | P2 | No Security link for enterprise-adjacent readers |
| NAV-W4 | P3 | No Copilot / AI Demo links for AI funnel |

---

## Phase E — Recommended IA (paper only)

**Do not implement in LG-4.6 audit phase.** Design target for a future LG-4.6 implementation pass.

### Hero

- `PublicPageHero` variant `centered` or `split-status`.
- Eyebrow: “Operational automation · honest readiness”.
- H1 question: **“Which workflow paths run automatically today?”**
- Subtitle: repeat positioning + explicit **“Not a BPM suite”** line.
- Optional hero metric chips: LIVE count / PARTIAL count / PLANNED count (derived from matrix, not vanity stats).

### Workflow stages (timeline)

Replace flat example cards with a **5-stage readiness timeline**:

1. **Signal** — issue, overdue task, missing evidence, report submit, risk score  
2. **Route** — notify manager / stakeholder (LIVE partial)  
3. **Review** — human approval queue (LIVE)  
4. **Automate** — rules engine + action dispatcher (PLANNED — stub today)  
5. **Audit** — traceability / approval events (LIVE)

Each stage links to proof surface (dashboard approvals, notifications API, workflow scaffold comment in code).

### Workflow categories (matrix)

| Category | Example | Status |
| --- | --- | --- |
| Approvals & sign-offs | Report/document pending queues | LIVE |
| Notifications | Manager inbox, stakeholder delivery | LIVE / PARTIAL |
| Issues & defects | Create → notify managers | LIVE |
| Evidence follow-up | Missing evidence insights | PARTIAL |
| Escalation | Overdue tasks | PARTIAL (manual manager actions) |
| AI triggers | Report submit → analysis job | PARTIAL (job enqueued; report handler no-op) |
| Scheduled ops | Recurring operational rules | PARTIAL (finite rule kinds, not generic BPM) |
| Rules engine | `workflow-engine` + `action-dispatcher` | PLANNED (noop handlers) |

### Related links (recommended set)

Platform · Features · AI Control · Mobile · Implementation · Security · Contact  
Optional: Pricing (commercial), API (automation integrators).

### CTA strategy

- Primary: Launch pilot (unchanged).  
- Secondary: Contact — “Map alerts and review paths”.  
- Tertiary text link: “See capability catalog → Features” above fold.

### Glass budget

- Target: **2–3** glass surfaces (hero panel optional + CTA floating + at most one matrix highlight card).  
- Keep example/path cards **solid** for readability and performance guardrails.

---

## Phase F — Risks

| ID | Sev | Risk | Evidence |
| --- | --- | --- | --- |
| TR-W1 | P1 | Benefits b1/b4 state outcomes in present tense without LIVE/PARTIAL/PLANNED | Examples hedged; benefits not |
| TR-W2 | P2 | metaDescription “automation engine expanding” ahead of `action-dispatcher` noop stubs | `workflow-engine.ts` exists; handlers noop |
| TR-W3 | P2 | ex4 “AI summary” — report job enqueued but `handleAiAnalyzeReport` is no-op sentinel | Partial label OK; could tighten to “analysis pipeline partial” |
| NAV-W1 | P1 | Weak site funnel integration | No inbound contextual links |
| NAV-W2 | P1 | Missing Platform/Features/Pricing outbound | Related set incomplete |
| I18N-W1 | P2 | Related block English in ru/es/it | `ru.json` lines 996–1009 |
| A11Y-W1 | P2 | Example paths not semantic `<ul>`/`<li>` | Div list in page.tsx |
| A11Y-W2 | P3 | Hero lacks `aria-labelledby` pattern used on richer pages | Plain section |
| DESIGN-W1 | P3 | Visual tier below Platform/API/Implementation | No `PublicPageHero` |
| BPM-W1 | — | **No P0 BPM overclaim** | Copy explicitly denies full BPM |
| AUTO-W1 | — | **No P0 autonomy overclaim** | Human review implied in related AI copy |
| RT-W1 | — | **No P0 real-time overclaim** | No “instant/real-time” strings on page |

---

## Final verdict (boundary)

**WORKFLOWS NOT READY**

Blockers before LG-4.6 implementation closure:

1. **P1 truth:** Align benefits with LIVE/PARTIAL/PLANNED labeling (or replace with readiness matrix).  
2. **P1 navigation:** Add contextual inbound/outbound to Platform and Features; consider Pricing.  
3. **P2 i18n:** Translate related-link block in ru/es/it.

No redesign performed in this audit. Implementation pass may follow separately.
