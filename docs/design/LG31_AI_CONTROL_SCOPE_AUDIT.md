# LG-3.1 AI Construction Control — Scope Audit

**Date:** 2026-06-18  
**Phase:** LG-3.1 — Architecture audit only  
**Companion:** `LG31_AI_CONTROL_BOUNDARY_AUDIT.md`  
**Route:** `/ai-construction-control`  
**Code entry:** `apps/web/app/[locale]/(public)/ai-construction-control/page.tsx`

---

## 1. Scope definition

### 1.1 In scope (LG-3.1 audit)

- Page current state inventory
- Ownership vs Home, Platform, Mobile, Copilot, About, FAQ, Contact
- AI marketing boundary (what Construction AI may claim)
- CTA and duplication classification
- Visual/glass **recommendations** (architecture only)
- Risk register for implementation

### 1.2 Out of scope

- Page redesign / component implementation
- i18n expansion commits
- `/ai-demo` redesign (noted as related route only)
- Dashboard Intelligence / copilot runtime behavior
- Gold Memory, Expert Review, staging AI flags
- Phase LG-3.2+ routes

---

## 2. Page inventory

| Property | Value |
|----------|-------|
| **Locales** | en, ru, es, it (static params) |
| **Namespace** | `public.aiControl` |
| **Leaf keys (EN)** | 13 |
| **Components used** | None from `@/components/public` |
| **Glass components** | None |
| **Client components** | None (RSC page) |
| **Forms / API** | None |
| **Sitemap** | Listed in `apps/web/sitemap.ts` |
| **Nav** | Secondary nav (`PublicHeader` → `aiControl`) |

### 2.1 Inbound links

| Source | Link type |
|--------|-----------|
| Homepage AI section | `Learn more` → `/ai-construction-control` |
| Platform grid | `capConstructionAi` card href |
| Header | Secondary nav direct |
| FAQ | Text reference (depth deferred to copilot for assistant; ai-control implied for analysis) |

### 2.2 Outbound links

| Target | Present today |
|--------|---------------|
| `/copilot` | ❌ |
| `/mobile` | ❌ |
| `/platform` | ❌ |
| `/ai-demo` | ❌ |
| `/contact` / `/dashboard` | ❌ (no CTA) |

**Implementation should add** lightweight cross-links — not full section rewrites of those pages.

---

## 3. Content scope map (current keys)

```
public.aiControl
├── title                    → h1
├── metaDescription          → body lede (should be SEO-only)
├── whatAiAnalyzes (+Desc)   → card 1
├── photoWorkflows (+Desc)   → card 2
├── deviationRisk (+Desc)  → card 3
├── managerInsights (+Desc)  → card 4  ⚠ rename scope in implementation
└── humanInTheLoop (+Desc)   → card 5
```

### 3.1 Keys needed for LG-3.1 implementation (recommended)

| Group | Est. keys | Purpose |
|-------|-----------|---------|
| Hero | 6–8 | eyebrow, heroTitle, heroSubtitle, visualLabel/Title, metaDescription |
| Inputs grid | 12–18 | 4–6 capabilities × title/desc |
| Pipeline timeline | 12–14 | 6 steps × title/desc |
| Detection grid | 12–18 | 4–6 items + one eyebrow |
| Trust / guardrails | 8–10 | 3–4 solid cards |
| Cross-links | 4–6 | platform, mobile, copilot, ai-demo labels |
| Footer CTA | 2 | ctaTitle, ctaSubtitle |
| **Total target** | **~50–60** | Align with LG-2B page depth |

---

## 4. Ownership scope vs peer pages

| Peer | What ai-control must NOT absorb | What ai-control may reference |
|------|----------------------------------|--------------------------------|
| **Home** | Full outcome story, hero lens metaphor | "See how analysis works" from teaser |
| **Platform** | Six-capability map, stack visual | "One layer in the platform stack" + link |
| **Mobile** | Start work, submit, inbox UX steps | "Analyzes photos after sync" + link |
| **Copilot** | Ask/answer, summarize chat, guardrails grid | "Assistant sits on analysis outputs" + link |
| **About** | Mission, principles, company trust | None required |
| **FAQ** | Objection Q&A | None required |
| **Contact** | Pilot process, form | Footer CTA only |

---

## 5. AI claims scope (allowed vs forbidden)

### 5.1 Allowed on ai-control (with human review framing)

- Photo progress and completeness analysis
- Before/after and time-series photo workflows as **analysis subjects**
- Deviation detection with severity
- Risk and schedule-pressure **signals** from operational data
- Evidence gap / missing documentation identification
- Recommendations and suggested actions **for manager review**
- Human-in-the-loop on analysis outputs

### 5.2 Forbidden on ai-control

| Forbidden claim | Reason |
|-----------------|--------|
| Autonomous approvals or silent record changes | Product truth + FAQ `trustAiAutonomousA` |
| "Chat with your project" / conversational UX | Copilot ownership |
| Full platform or mobile workflow tutorials | Platform / Mobile ownership |
| LIVE AI / Level 4 without validation gate | `AUDIT_AI_VALIDATION_REPORT.md` |
| Internal margin, cost overrun, subcontractor economics | Customer-finance roadmap |
| Gold Memory / Expert Review pipeline details | Internal flywheel — concept-only elsewhere |
| Fake metrics (500+ projects, etc.) | LG-2B proof discipline |

### 5.3 `/ai-demo` relationship

| Route | Scope |
|-------|-------|
| `/ai-construction-control` | Explain Construction AI — **canonical product story** |
| `/ai-demo` | Mock simulator — **try experience** with `demoUsesMockOutput` disclaimer |

Duplication between them is **scope overlap**, not ownership conflict — resolve with cross-links and distinct hero intent.

---

## 6. CTA scope

### 6.1 Current

No CTAs on page. No Request Demo. **Gap:** missing global conversion band.

### 6.2 Target (implementation)

| Element | Scope |
|---------|-------|
| Footer | `PublicCTASection` floating, `public.cta.*` |
| Hero | No duplicate conversion stack (match LG-2B pages) |
| Optional tertiary | Text link to `/ai-demo` ("Try interactive demo") — not primary |
| Optional secondary page link | "Explore Copilot" or "See platform" — inline, not competing with Launch pilot |

---

## 7. Visual scope (architecture)

| Layer | Scope for LG-3.1 implementation |
|-------|----------------------------------|
| Shell | Public layout (existing LG-2A) |
| Hero | `PublicPageHero` split-visual + one analysis visual |
| Body | 2× `PublicFeatureGrid`, 1× `PublicTimelineSection`, optional solid trust grid |
| Proof | Optional `PublicProofSection` — qualitative only |
| Glass | ≤3 nodes (see boundary audit) |
| Footer | `PublicCTASection` |

**Explicitly out of visual scope:** chat UI, homepage lens, pricing tables, contact form embed.

---

## 8. Duplication scope summary

| Class | Count | Examples |
|-------|-------|----------|
| **KEEP** | 2 | Deviation/risk as canonical depth; platform card link |
| **MERGE** | 1 | Human-in-the-loop shared snippet |
| **REMOVE** | 1 | metaDescription as visible intro |
| **REWRITE** | 6 | Five cards → structured sections; manager insights framing; photo workflow boundary; hero title; nav label; add CTAs |

---

## 9. Implementation readiness checklist (next phase)

| # | Gate | Audit status |
|---|------|--------------|
| 1 | Ownership defined | ✅ |
| 2 | Copilot boundary clear | ✅ (LG-2B.3 + this audit) |
| 3 | Customer-finance safe claims | ✅ |
| 4 | CTA target known | ✅ |
| 5 | Glass budget known | ✅ |
| 6 | Component strategy known | ✅ (`LG2B_COMPONENT_STRATEGY.md`) |
| 7 | i18n expansion plan | ✅ (~50–60 keys) |
| 8 | Page code ready | ❌ legacy — **implementation required** |

---

## 10. Verdict

# AI CONTROL READY

Architecture scope for `/ai-construction-control` is **ready for LG-3.1 implementation**. The audit phase is complete; redesign is explicitly deferred to the next execution step.

**Not ready items (expected):** page code, expanded i18n, footer CTA, shared components — tracked as implementation work, not audit blockers.

**Do not redesign in this phase.**  
**Do not commit.**
