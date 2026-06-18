# LG-3.1 AI Construction Control — Boundary Audit

**Date:** 2026-06-18  
**Phase:** LG-3.1 — Architecture audit only (**no page redesign**)  
**Branch:** `design/liquid-glass-public-shell-lg2a`  
**Route:** `/[locale]/ai-construction-control`  
**Prerequisite:** LG-2B global closure (`27ed9b0a`)

---

## 1. Current state (`/ai-construction-control`)

### 1.1 Implementation snapshot

| Attribute | Current state |
|-----------|---------------|
| **File** | `apps/web/app/[locale]/(public)/ai-construction-control/page.tsx` |
| **Pattern** | Pre–LG-2B legacy: inline markup, no shared public components |
| **Layout** | Single column `max-w-4xl`, `py-16` shell |
| **i18n** | `public.aiControl.*` (13 leaf keys, EN/RU/ES/IT parity exists) |
| **Glass** | None |
| **CTA** | **None** — conversion dead end |
| **Nav** | Secondary nav item `public.nav.aiControl` → label **"AI Control"** (not full product name) |

### 1.2 Hero (de facto)

There is no `PublicPageHero`. The page opens with:

| Element | Source | Copy (EN) |
|---------|--------|-----------|
| **h1** | `public.aiControl.title` | "AI Construction Control" |
| **Intro paragraph** | `public.aiControl.metaDescription` | "What AI analyzes, photo workflows, deviation and risk detection, manager insights." |

**Issues:**

- SEO `metaDescription` reused as visible body — anti-pattern (also flagged in `LG2B_CONTENT_DEDUP_AUDIT.md`).
- Title string overlaps homepage hero theme ("AI construction control") without a differentiated lede.
- No eyebrow, no visual, no canonical CTA stack.

### 1.3 Sections (5 cards)

Vertical stack of identical `.card` blocks (`mt-12 space-y-8`):

| # | Key | Heading (EN) | Body focus |
|---|-----|--------------|------------|
| 1 | `whatAiAnalyzes` | What AI analyzes | Site photos → progress, completeness, deviations |
| 2 | `photoWorkflows` | Photo before/after workflows | Before/after, time-series, automatic analysis and alerts |
| 3 | `deviationRisk` | Deviation & risk detection | Severity + suggested actions |
| 4 | `managerInsights` | Manager insights | Recommendations prioritized by impact |
| 5 | `humanInTheLoop` | Human-in-the-loop | Humans decide; AI supports |

**Visual language:** Solid cards, legacy radius/shadow tokens — **not** LG liquid-glass system. No hero visual, timeline, proof band, or cross-links.

### 1.4 CTA structure

| Tier | Present? |
|------|----------|
| Launch pilot | ❌ |
| Contact us | ❌ |
| Get presentation | ❌ |
| Request Demo / Book Demo | ❌ (good — no legacy demo label on this page) |
| In-page teaser CTA | ❌ |
| Inbound links | Home "Learn more"; Platform `capConstructionAi` card → this route |

### 1.5 AI claims (marketing surface)

| Claim type | On page today | Risk |
|------------|---------------|------|
| Photo/progress/deviation analysis | ✅ Stated | OK — matches product direction |
| Automatic analysis and alerts | ✅ `photoWorkflowsDesc` | OK if paired with human review (card 5) |
| Suggested actions | ✅ `deviationRiskDesc` | OK — recommendations, not autonomous execution |
| Live LLM / Level 4 / all tenants | ❌ Absent | Good — no fake LIVE gate |
| Conversational assistant | ❌ Absent | Good — belongs on `/copilot` |
| Gold Memory / Expert Review internals | ❌ Absent | Good |
| Internal contractor finance / margin | ❌ Absent | Good — customer-finance safe |

---

## 2. Overlap analysis

### 2.1 vs Homepage

| Homepage element | Overlap with ai-control |
|------------------|-------------------------|
| Hero h1 "AI construction control" | **High** — same product noun, different depth missing |
| `aiSectionSubtitle` | **High** — "Photo-based analysis, deviation detection, manager insights, human-in-the-loop" ≈ all five cards summarized |
| Hero lens stream "AI flag — foundation sign-off pending" | **Medium** — same metaphor; homepage shows outcome, ai-control should explain analysis mechanics |
| Hero card "AI insights — Progress, risks, delays" | **Medium** — teaser only; acceptable if ai-control goes deeper on inputs/pipeline |

**Homepage owns:** AI construction control **outcome** and emotional entry.  
**Ai-control must own:** **How** analysis works on evidence — not repeat the one-line teaser.

### 2.2 vs `/copilot` (post LG-2B.3)

| Copilot element | Overlap |
|-----------------|---------|
| Hero "Ask your project what needs attention" | **Low** — assistant framing; distinct |
| `helpSurfaceRisks`, `helpMissingEvidence` | **Medium** — copilot surfaces signals; ai-control explains detection on photos/reports |
| Timeline `stepAnalysisDesc` | **Medium** — "Construction-specific signals… progress, gaps, risks" — must stay one line on copilot; depth lives here |
| `guardHumanReview`, `guardNoBlindAutomation` | **Low** — copilot guardrails for assistant; ai-control human-in-the-loop for **analysis outputs** |

**Copilot owns:** Manager **assistant workflow** (ask, summarize, explain, prepare decisions).  
**Ai-control owns:** **Analysis engine** on synced evidence — not chat UX.

FAQ explicitly defers: `coreAiManagersA` → copilot for assistant; ai-control for photo-analysis depth (once redesigned).

### 2.3 vs `/platform`

| Platform element | Overlap |
|------------------|---------|
| `capConstructionAi` + link to this route | **High by design** — one-card summary; canonical depth is ai-control |
| `stepAiDesc` | **Medium** — one timeline beat; must not expand into full page copy |
| `visualLayerAiDetail` | **Low** — stack map only |

**Platform owns:** AI as **one capability** in the product map.  
**Ai-control owns:** Expanded **Construction AI** chapter — inputs, pipelines, signals, review.

### 2.4 vs `/mobile`

| Mobile element | Overlap |
|----------------|---------|
| Before/after photo workflow | **Medium boundary** — mobile owns **capture/submit/sync**; ai-control owns **analysis after sync** |
| Manager review inbox | **Low** — mobile owns review **workflow**; ai-control owns what AI flags during review |

**Rule:** Mention photo workflows as **analysis subjects**, not field UX steps.

### 2.5 vs `/ai-demo`

| ai-demo element | Overlap |
|-----------------|---------|
| Capabilities grid (photoAnalysis, deviationDetection, riskPrediction…) | **High** — same capability nouns |
| Interactive mock simulator | **Unique to ai-demo** — try experience |

**Split:** `/ai-construction-control` = product **explanation**; `/ai-demo` = **interactive mock** (keep mock disclaimer).

---

## 3. Ownership decision

### 3.1 Canonical question

**"What does AISTROYKA's Construction AI analyze, detect, and surface — before a manager acts?"**

### 3.2 Assigned ownership — `/ai-construction-control`

**UNIQUELY OWNS:**

| Domain | Scope |
|--------|--------|
| **Evidence analysis** | Photos, report text, linked tasks — what enters the analysis layer |
| **Photo analysis** | Progress/completeness vs plan or baseline; before/after and time-series |
| **Deviation detection** | Scope drift, missing work, inconsistent evidence |
| **Risk detection** | Schedule pressure, blocked evidence, severity framing |
| **Project signals** | Operational flags derived from field data (not portfolio finance) |
| **Issue identification** | Gaps, missing sign-offs, evidence holes |
| **Construction intelligence engine** | Pipeline narrative: sync → analyze → flag → manager review |
| **Human-in-the-loop (analysis)** | AI suggests; humans approve/reject/escalate — no silent automation |

**DOES NOT OWN:**

| Topic | Canonical page |
|-------|------------------|
| Chat / Q&A assistant | `/copilot` |
| Platform capability map | `/platform` |
| Field capture & sync UX | `/mobile` |
| Product outcome promise | `/` homepage |
| Company mission / trust story | `/about` |
| Adoption objections | `/faq` |
| Conversion / pilot onboarding | `/contact` |
| Interactive mock try-it | `/ai-demo` |

### 3.3 Suggested direction — validation

| Suggested pillar | Verdict |
|------------------|---------|
| Evidence analysis | ✅ **Validate** — extend with report + task-linked evidence |
| Photo analysis | ✅ **Validate** — core of current copy |
| Risk detection | ✅ **Validate** — align wording with dashboard "risk signals", not finance |
| Project signals | ✅ **Validate** — frame as operational flags, not owner P&L |
| Issue identification | ✅ **Validate** — missing evidence, blocked tasks |
| Construction intelligence engine | ✅ **Validate** — use as eyebrow/engine framing, not generic "AI platform" |
| NOT chat assistant | ✅ **Reject** chat ownership — confirmed |
| NOT platform overview | ✅ **Reject** — link out, one cross-link strip max |
| NOT field workflow | ✅ **Reject** — link to `/mobile` for capture |
| NOT company mission | ✅ **Reject** |

**Refinement:** Rename marketing lede away from duplicating homepage h1. Prefer hero like **"Construction AI on your evidence"** with subtitle explaining analysis on photos + field data.

---

## 4. CTA audit

| Item | Location | Classification | Action (implementation phase) |
|------|----------|----------------|--------------------------------|
| Request Demo | Not on ai-control | **KEEP** (absent) | — |
| Book Demo | Not on ai-control | **KEEP** (absent) | — |
| No conversion band | Page bottom | **REWRITE** | Add `PublicCTASection` + `public.cta.*` |
| Home → Learn more | Homepage AI section | **KEEP** | Teaser link into this page |
| Platform card link | `capConstructionAi` href | **KEEP** | Primary discovery path |
| ai-demo "Try AI demo" | `/ai-demo` | **KEEP** | Separate intent; add cross-link "Try interactive demo" as optional tertiary text link, not primary CTA |
| Nav label "AI Control" | `public.nav.aiControl` | **REWRITE** | Align with "Construction AI" or "AI Control" consistently with page title |

**Hierarchy violations today:** Missing footer CTA band (**P1** for implementation — conversion leak per `LG2B_CTA_ARCHITECTURE.md`).

---

## 5. Content duplication audit

| Content | Also appears on | Class | Action |
|---------|-------------------|-------|--------|
| Five-card capability list | Homepage AI section (summary) | **REWRITE** | Expand to pipeline + inputs grid; do not keep 5 parallel one-liners |
| Human-in-the-loop paragraph | Homepage, platform AI card, copilot guards, about | **MERGE** | Shared short `public.aiShared.analysisHumanReview` reference (implementation) |
| Photo before/after | Mobile workflow section | **REWRITE** | Ai-control: analysis lens; Mobile: capture lens |
| Manager insights | Copilot helps, homepage | **REWRITE** | Ai-control: **analysis recommendations**; Copilot: **answers from context** |
| Deviation & risk | Platform step AI, ai-demo caps | **KEEP** on ai-control | Canonical depth here; shorten elsewhere |
| metaDescription as body | Many legacy pages | **REMOVE** | Dedicated `heroSubtitle` key |
| Title "AI Construction Control" | Homepage `aiSectionTitle` | **REWRITE** | Differentiate hero title vs homepage section title |

---

## 6. Visual architecture (recommendation only — DO NOT IMPLEMENT)

### 6.1 Hero

| Property | Recommendation |
|----------|----------------|
| **Component** | `PublicPageHero` `variant="split-visual"` |
| **Eyebrow** | e.g. "Construction intelligence" |
| **Title** | Distinct from homepage h1 — analysis/engine framing |
| **Subtitle** | Dedicated lede (not `metaDescription`) |
| **CTAs in hero** | `ctas={false}` — match Platform/Mobile/Copilot pattern; conversion in footer band |
| **Visual** | `GlassHeroCard` — **analysis signal panel** (progress %, deviation flag, risk severity, evidence gap) — **not** chat prompt, **not** homepage Tower B lens |

### 6.2 Section structure (target IA)

1. **Hero** — what Construction AI is (engine on evidence)
2. **Inputs grid** (`PublicFeatureGrid`) — photos, daily reports, tasks, schedule context, documents
3. **Analysis pipeline** (`PublicTimelineSection`) — ingest → analyze → flag signals → manager review → record
4. **Detection capabilities** (`PublicFeatureGrid`, one `glass-highlight`) — deviation, risk, progress, evidence gaps
5. **Trust band** (solid cards) — human-in-the-loop, no blind automation, explainable flags — **one paragraph**; link to `/copilot` for assistant layer
6. **Optional proof** (`PublicProofSection` stat-row) — qualitative stats only (e.g. signal types, review steps) — **no fake 500+ metrics**
7. **Cross-links** (solid inline) — Platform · Mobile · Copilot · AI Demo (mock)
8. **Footer** — `PublicCTASection` `variant="floating"`

### 6.3 Glass budget

Per `LG2B_GLASS_GOVERNANCE.md`: **max 3 nodes** including layout `GlassNav`.

| Node | Placement |
|------|-----------|
| 1 | Layout `GlassNav` |
| 2 | Hero analysis signal `GlassHeroCard` |
| 3 | `PublicCTASection` floating **OR** one `glass-highlight` detection card — **not both** if budget stays at 3 |

**Recommendation:** Nav + hero visual + floating CTA = 3. Keep capability grid solid; use one glass highlight only if CTA uses `variant="band"` instead.

### 6.4 Visual language

- Reuse LG-2B public components — no new one-off card CSS
- No FAQ-style long prose in glass
- No chat mock UI (forbidden on this page — copilot owns assistant metaphor)
- No homepage lens clone

---

## 7. Risks (for implementation)

| ID | Sev | Risk | Mitigation |
|----|-----|------|------------|
| R-01 | **P0** | Marketing claims imply autonomous project changes or LIVE AI for all tenants | Copy review against `docs/ai/AUDIT_AI_VALIDATION_REPORT.md`; human review always visible |
| R-02 | **P0** | AI insights surface internal contractor finance to wrong audience | Keep signals operational; no margin/cost language; align customer-finance roadmap |
| R-03 | **P1** | Hero title duplicates homepage — SEO and IA collision | New hero title + eyebrow; homepage keeps outcome framing |
| R-04 | **P1** | No `PublicCTASection` — conversion leak | Mandate footer band in LG-3.1 implementation |
| R-05 | **P1** | Copilot timeline `stepAnalysis` reads like full ai-control page | Keep one line on copilot; link "How analysis works" → ai-control |
| R-06 | **P2** | `/ai-demo` capability grid duplicates ai-control | ai-control = narrative; ai-demo = try mock; cross-link with distinct labels |
| R-07 | **P2** | `managerInsights` card blurs into Copilot | Rename to "Analysis recommendations" / "Review-ready flags" |
| R-08 | **P2** | Photo workflow copy duplicates Mobile | Explicit boundary copy in inputs vs capture |
| R-09 | **P2** | metaDescription as body | Add `heroSubtitle`, `metaDescription` SEO-only |
| R-10 | **P3** | Nav label "AI Control" vs page "AI Construction Control" | Harmonize in i18n pass |
| R-11 | **P3** | Only 13 i18n keys — insufficient for 4-locale LG section depth | Expand like LG-2B pages (~40–60 keys) at implementation |
| R-12 | **P3** | Legacy `.card` markup | Replace with `PublicFeatureGrid` / shared sections |

---

## 8. Boundary matrix (marketing layer)

| Page | Owns |
|------|------|
| **Homepage** | AI construction control **outcome** |
| **Platform** | Product **capability map** (AI = one card → ai-control) |
| **Mobile** | **Field workflow** (capture/sync/review UX) |
| **Copilot** | **AI assistant workflow** for managers |
| **AI Construction Control** | **Construction intelligence / analysis engine** on evidence |
| **About** | Mission, trust, principles |
| **FAQ** | Objections; links out for depth |
| **Contact** | Pilot conversion |
| **AI Demo** | Interactive mock try experience |

---

## 9. Audit verdict

# AI CONTROL READY

Ownership, boundaries, and target IA are **defined and consistent** with LG-2B copilot/platform/home splits. The current page **does not yet implement** this architecture (legacy layout, no CTA, duplication) — that is expected work for **LG-3.1 implementation**, not a blocker to this audit.

**P0 blockers for architecture definition:** none  
**P1 items for next phase:** hero differentiation, footer CTA, copilot/platform cross-link discipline

**Do not redesign in this phase.**  
**Do not commit.**
