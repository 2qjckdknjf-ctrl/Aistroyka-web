# LG-2B Scope Audit

**Date:** 2026-06-18  
**Phase type:** Architecture & planning only — **no production page changes**  
**LG-2A baseline:** `a59a014ba0d3a188917f736ef6a8f11ee8dfa485` — `design: redesign public shell and hero`

---

## 1. Page inventory summary

**Total public marketing routes:** 24 under `(public)/` + 2 dynamic slug routes  
**LG-2A complete:** `/` hero + public shell (layout, header, ambient)  
**LG-2B mandated first wave:** 6 pages (platform → contact)  
**LG-2B phase 2:** 16 remaining routes + homepage lower-section dedupe

| Wave | Routes | Pattern today |
|------|--------|---------------|
| 2B.1–2B.6 | platform, mobile, copilot, about, faq, contact | Mostly inline markup; no shared page templates; no page-level glass |
| Phase 2 | features, solutions, pricing, enterprise, ai-*, workflows, integrations, api, security, cases, docs, partners, implementation, showcase, legal | Same inline patterns + CTA label fragmentation |

Full detail: `LG2B_PAGE_INVENTORY.md`

---

## 2. Duplication findings

**High-impact duplicates:**

1. **Metrics** — hero glass chips + lower homepage strip (same numbers)
2. **Modules** — home 4-card grid ⊂ `/features` 8-card grid
3. **Roles** — home 3 roles ⊂ `/solutions` 5 roles
4. **AI story** — home teaser + `/ai-construction-control` + `/copilot` (three voices, overlapping copy keys)
5. **Mobile story** — home teaser + `/mobile` + `/platform` app cards + FAQ mobile answer
6. **CTAs** — “Request Demo” appears in 6+ surfaces while LG-2A hero established Launch pilot / Contact us / Get presentation

**Canonical ownership defined** — see `LG2B_CONTENT_DEDUP_AUDIT.md`

| Action type | Count |
|-------------|-------|
| Keep | 9 |
| Merge | 13 |
| Remove | 2 |
| Rewrite | 8 |

---

## 3. Reusable component plan

Introduce **6 shared blocks** before page-by-page styling drift:

| Component | Role |
|-----------|--------|
| `PublicPageHero` | Variant-based opener (not homepage lens clone) |
| `PublicFeatureGrid` + `PublicFeatureCard` | All card catalogs |
| `PublicCTASection` | Wraps existing `PublicHeroCTA` |
| `PublicProofSection` | Trust/stats without hero metric duplication |
| `PublicTimelineSection` | Implementation / rollout phases |

**LG-2A reuse:** `PublicHeroCTA`, shell layout, `GlassNav` — do not fork.

Full detail: `LG2B_COMPONENT_STRATEGY.md`

---

## 4. CTA architecture

**Target hierarchy:**

1. Launch pilot → `/dashboard`
2. Contact us → `/contact`
3. Get presentation → `/contact`

**Current chaos:** Legacy “Request Demo” on home final band, copilot, workflows, pricing; 6+ pages with **no CTA at all**.

**Fix strategy:** Mandate `PublicCTASection` on every LG-2B page; i18n migration per sub-phase.

Full detail: `LG2B_CTA_ARCHITECTURE.md`

---

## 5. Glass governance

- **Budget:** ≤ 6 visible glass nodes per viewport (unchanged)
- **Homepage signature:** lens + metric chips — **not replicated**
- **Other pages:** nav + optional 1 hero visual + optional floating CTA; **FAQ/forms/grids stay solid**

Full detail: `LG2B_GLASS_GOVERNANCE.md`

---

## 6. Information architecture — unique page job

| Page | Must uniquely communicate | Overlap risk |
|------|---------------------------|--------------|
| **Homepage** | AI construction control — outcome promise | ✅ LG-2A hero done; lower sections still overlap child pages |
| **Platform** | Full product stack map (web + apps + AI + integrations) | vs home modules, vs features catalog |
| **Mobile** | Field reporting workflow (manager/worker, speed, evidence) | vs platform app cards, vs home mobile teaser |
| **Copilot** | AI intelligence **layer** — chat, patterns, human-in-the-loop | vs ai-construction-control, vs home AI section |
| **About** | Company mission, market problem, why AISTROYKA, reliability | vs home pain/solution tone |
| **FAQ** | Objection handling (what/who/how AI/mobile/pricing) | vs all product pages — answers must link out, not repeat |
| **Contact** | Conversion — form, trust, next steps | vs every “contact us” button on site |

**Overlap verdict:** Pages overlap **too much today** in copy and structure — LG-2B implementation must apply dedup audit **before** visual polish, or six styled pages will still say the same thing.

**IA guardrail:** Each page hero subtitle must answer “why this page exists” in one sentence — not restate homepage h1.

---

## 7. Recommended implementation order

### Wave 1 — Foundation (before 2B.1)

| Step | Deliverable | Why first |
|------|-------------|-----------|
| **LG-2B.0** | Shared components (`PublicPageHero`, `PublicFeatureGrid`, `PublicFeatureCard`, `PublicCTASection`) + `index.ts` exports | Prevents six one-off heroes |
| **LG-2B.0** | Shared i18n keys `public.cta.*` | CTA consistency |
| **LG-2B.0b** | Homepage lower metrics strip dedupe (optional micro-pass) | Removes P3 tail before platform launch |

### Wave 2 — Mandated pages (user order)

| ID | Page | Key deliverables |
|----|------|------------------|
| **LG-2B.1** | Platform | `split-visual` hero (stack diagram); module grid; bottom CTA; cross-links |
| **LG-2B.2** | Mobile | Device/workflow hero; 4 workflow cards; Launch pilot emphasis |
| **LG-2B.3** | Copilot | Centered hero; rewrite CTAs; solid mock UI; patterns grid |
| **LG-2B.4** | About | Compact hero; narrative grid; proof line |
| **LG-2B.5** | FAQ | Compact hero; solid Q&A; bottom CTA |
| **LG-2B.6** | Contact | Conversion hero; solid form; trust proof; presentation link |

### Wave 3 — Phase 2 (after 2B.6 closure)

Roll template to: features → solutions → pricing → enterprise → ai-construction-control → ai-demo → workflows → integrations → api → security → cases/docs → partners → implementation → legal polish.

**Do not start Wave 3 until Wave 2 has post-audit YES.**

---

## 8. Preconditions met

| Precondition | Status |
|--------------|--------|
| LG-2A committed | ✅ `a59a014b` |
| Canonical glass path | ✅ `@/components/design/liquid-glass` |
| Public shell stable | ✅ layout + header + ambient |
| Page inventory | ✅ |
| Dedup strategy | ✅ |
| Component architecture | ✅ |
| Glass rules | ✅ |
| CTA target model | ✅ |
| Implementation order | ✅ |

---

## 9. Remaining planning risks

| ID | Severity | Item | Mitigation |
|----|----------|------|------------|
| SKIP-2B0 | **P1** | Implementing pages before shared components | **Block** — require LG-2B.0 first in implementation prompt |
| AI-OVERLAP | **P2** | copilot vs ai-construction-control copy collision | Rewrite pass in 2B.3 + phase 2 ai-control |
| CTA-LEGACY | **P2** | Request Demo keys persist | i18n migration checklist in 2B.3 + home tail |
| HARDCODED-EN | **P2** | 5 pages with English section headings | Phase 2 i18n |
| NO-VISUAL-REG | **P3** | No screenshot CI | Manual acceptance per sub-phase |

**P0:** none

---

## 10. Final verdict

Architecture, deduplication strategy, component plan, glass governance, and CTA model are **defined and actionable**. LG-2A provides a stable shell. The main implementation risk (six different styles) is mitigated by **mandatory LG-2B.0 shared components** before page work.

# READY FOR LG-2B IMPLEMENTATION

**Condition:** Implementation prompt must enforce:

1. Build **LG-2B.0 shared components first**
2. Follow order **2B.1 → 2B.6** only (no phase 2 until closure)
3. Apply dedup + CTA rewrites per page
4. No modification to dashboard/auth/admin/API
5. Per-page glass budget from `LG2B_GLASS_GOVERNANCE.md`

---

## Related documents

| Document | Purpose |
|----------|---------|
| `LG2B_PAGE_INVENTORY.md` | Full route audit |
| `LG2B_CONTENT_DEDUP_AUDIT.md` | Keep / merge / remove / rewrite |
| `LG2B_COMPONENT_STRATEGY.md` | Shared block architecture |
| `LG2B_GLASS_GOVERNANCE.md` | Glass allow/deny matrix |
| `LG2B_CTA_ARCHITECTURE.md` | Funnel + migration |
| `LG2A_FINAL_NO_TAIL_AUDIT.md` | LG-2A closure evidence |
