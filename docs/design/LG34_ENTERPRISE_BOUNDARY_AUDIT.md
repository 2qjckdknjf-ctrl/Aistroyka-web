# LG-3.4 Enterprise — Boundary Audit

**Date:** 2026-06-18  
**Phase:** LG-3.4 — Architecture audit only (**no redesign**)  
**Branch:** `design/liquid-glass-public-shell-lg2a`  
**Route:** `/[locale]/enterprise`  
**Prerequisite:** LG-3.3 Pricing closed (uncommitted implementation); modernized peers: Home, Platform, Features, Mobile, AI Control, Copilot, About, FAQ, Contact, Pricing

---

## A. Current state (`/enterprise`)

### A.1 Implementation snapshot

| Attribute | Current state |
|-----------|---------------|
| **File** | `apps/web/app/[locale]/(public)/enterprise/page.tsx` |
| **Pattern** | Pre–LG-2B legacy: inline markup, no shared public components |
| **Layout** | Single column `max-w-5xl`, centered hero + two card grids + inline CTAs |
| **i18n** | `public.enterprise.*` — **18 leaf keys** (EN/RU/ES/IT parity on keys) |
| **Glass** | None (0 nodes — inconsistent with LG-2+ modernized pages) |
| **CTA** | Inline only — `ctaSales` + `getPresentation`; **no** `PublicCTASection` |
| **Nav** | Primary nav (`PublicHeader`) + footer link |
| **Inbound links** | **Pricing only** among modernized pages (`enterpriseEvaluation` card + related strip) |

### A.2 Hero

| Element | Source | Copy (EN) | Issue |
|---------|--------|-----------|-------|
| **h1** | `public.enterprise.title` | "Enterprise" | Generic label — not a readiness proposition |
| **Subtitle** | `public.enterprise.heroTitle` | "Enterprise construction operations platform" | **Platform overlap** — reads like `/platform` hero, not enterprise readiness |
| **Eyebrow** | — | Absent | No LG-2+ framing |
| **metaDescription** | SEO only | "Multi-project governance, auditability, security, AI oversight. Enterprise readiness." | Not reused as body (good) — but hero under-delivers vs meta promise |

### A.3 Sections

| # | Heading | Source | Content |
|---|---------|--------|---------|
| 1 | **"Enterprise capabilities"** | **Hardcoded English in TSX** | 8 opaque tiles: `s1`–`s8` (title-only, no descriptions) |
| 2 | **"Enterprise readiness"** | **Hardcoded English in TSX** | 4 opaque tiles: `r1`–`r4` (title-only, no descriptions) |
| 3 | CTAs | i18n + `public.cta` | Contact sales + Get presentation → both `/contact` |

**Visual language:** Legacy bordered cards — outside liquid-glass public system. No `PublicPageHero`, `PublicFeatureGrid`, `PublicTimelineSection`, `PublicProofSection`, or related-page strip.

### A.4 i18n inventory (`public.enterprise.*`)

| Key group | Keys | Notes |
|-----------|------|-------|
| Meta | `title`, `heroTitle`, `metaDescription` | Present all locales |
| Capabilities | `s1`–`s8` | One-line labels only — no `*Desc` |
| Readiness | `r1`–`r4` | One-line labels only — **r1 duplicates s2 semantically** |
| CTA | `ctaSales` | Non-canonical — not `public.cta.contactUs` |

**Locale quality note:** IT/ES `metaDescription` is abbreviated vs EN ("Governance, audit, security." vs full EN sentence) — parity on keys exists, copy depth uneven.

### A.5 Hardcoded English (P1)

```tsx
// enterprise/page.tsx — not in i18n
"Enterprise capabilities"
"Enterprise readiness"
```

Violates next-intl governance on a localized public route.

---

## B. Ownership analysis

### B.1 Canonical question

**"What enterprise readiness does AISTROYKA offer that no other page owns?"**

### B.2 Assigned ownership — `/enterprise` (target)

| Should own | Should NOT own |
|------------|----------------|
| Enterprise **readiness** framing (governance, scale, SSO evaluation, retention posture) | Product capability catalog (→ `/features`) |
| Multi-project / multi-site **organizational** governance narrative | Platform stack map (→ `/platform`) |
| Enterprise **evaluation criteria** (what large orgs assess before rollout) | Commercial engagement models (→ `/pricing`) |
| Security/compliance **summary for buyers** with link-out | Security deep-dive (→ `/security`, FAQ trust) |
| AI **governance at scale** (oversight, not pipeline) with link-out | AI analysis pipeline (→ `/ai-construction-control`) |
| Integration **readiness at enterprise scale** with link-out | Integrations vendor catalog (→ `/integrations`) |
| Path to contact / pilot after evaluation | Contact form workflow (→ `/contact`) |
| — | Implementation phase walkthrough (→ `/implementation`) |
| — | Pilot onboarding process detail (→ `/contact`, `/pricing` process) |

### B.3 What the page actually owns today

**Partial intent, weak execution:** Tile labels gesture at readiness topics but read as **undifferentiated product bullets** — the same nouns appear on Features, Platform, FAQ, and About with more depth elsewhere.

**Unique angle not delivered:** Pricing now promises "SSO, scale, retention, and enterprise requirements" on the enterprise evaluation card and links here — **Enterprise does not answer that promise** with evaluation framing, process, or related links back to Pricing/Contact.

### B.4 Page boundary matrix (peer comparison)

| Page | Question answered | Enterprise collision |
|------|-------------------|----------------------|
| Homepage | Outcome | Low — no enterprise section |
| Platform | Stack map | **High** — heroTitle mirrors platform positioning; s7/s8 imply stack |
| Features | Capability catalog | **High** — roles, integrations, audit trail tiles duplicate catalog |
| Mobile | Field workflow | Low |
| AI Control | Intelligence engine | **Medium** — s5 "AI oversight" without boundary/link |
| Copilot | Assistant | Low direct; tenant guardrails live on Copilot |
| About | Mission + trust principles | **Medium** — auditability, transparency overlap trust |
| FAQ | Objections (trust Q&A) | **High** — r1/s2/s4/s6 duplicate FAQ trust answers |
| Contact | Conversion + pilot process | **Medium** — CTAs duplicate Contact; no form |
| **Pricing** | Commercial packaging | **Medium** — evaluation link-in without reciprocal Pricing link-out |
| **Enterprise** | **Enterprise readiness** | **Under-defined** |

---

## C. Duplication map

### C.1 Capability tiles (`s1`–`s8`) vs peers

| Enterprise key | Label (EN) | Primary duplicate peer | Severity |
|----------------|------------|------------------------|----------|
| `s1` | Multi-project governance | Pricing `multiProjectDesc`; Solutions `forGeneralContractorDesc` | **High** |
| `s2` | Multi-role access | Features `roles`/`rolesDesc`; FAQ `trustAccessControlA` | **High** |
| `s3` | Auditability | About trust; Platform `capDocumentsApprovalsDesc`; AI Control audit trail | **High** |
| `s4` | Security | FAQ trust; About trust; **`/security` page** | **High** |
| `s5` | AI oversight | AI Control entire page; FAQ `trustAiAutonomousQ` | **Medium** |
| `s6` | Tenant isolation | FAQ `trustDataVisibilityA`; Copilot `guardTenantContext` | **Medium** |
| `s7` | Integrations | Features `integrations`; Platform stack; **`/integrations`** | **High** |
| `s8` | Implementation support | **`/implementation`** phases; Pricing onboarding; Contact onboarding | **High** |

**Pattern:** Enterprise lists **product surface areas** instead of **enterprise readiness dimensions** — boundary failure vs Features/Platform.

### C.2 Readiness tiles (`r1`–`r4`) vs peers

| Key | Label (EN) | Duplicate of | Severity |
|-----|------------|--------------|----------|
| `r1` | Role-based access | `s2`, Features roles, FAQ trust | **High** (internal duplicate) |
| `r2` | Scalable architecture | Platform "unified stack" hero | **Medium** (vague) |
| `r3` | Reporting consistency | Mobile reporting; Platform field reporting | **Medium** |
| `r4` | Operational transparency | Home hero lens; About mission | **Medium** |

**Internal redundancy:** "Enterprise capabilities" and "Enterprise readiness" grids restate the same themes without hierarchy or link-out strategy.

### C.3 Trust claims

| Enterprise | Peer with richer trust content |
|------------|--------------------------------|
| One-line tiles (no proof) | About `PublicProofSection`; Platform proof stats; FAQ trust Q&A |
| No "no invented certifications" guardrail | About explicitly states this |
| No customer-finance boundary | FAQ `opsOwnerProgressA` handles stakeholder isolation |

Enterprise adds **no unique trust evidence** — only thinner restatements.

### C.4 Platform language duplication

| Enterprise copy | Platform / peer copy | Issue |
|-----------------|---------------------|-------|
| `heroTitle`: "Enterprise construction **operations platform**" | Platform `heroTitle`: "Unified construction **operations platform**" | Same category claim — Enterprise reads as Platform variant |
| `s2`, `s6`, `s7` | Platform capability map + Features connectivity | Module inventory, not enterprise readiness |
| `r2` Scalable architecture | Platform stack visual + timeline | Architecture story belongs on Platform |

### C.5 Feature description duplication

Enterprise tiles are **headline-only** duplicates of Features/Platform module names without enterprise-specific depth (SSO, data retention, org-wide RBAC, multi-tenant admin, procurement evaluation checklist, etc.) — the topics Pricing promises via `enterpriseEvaluationDesc`.

---

## D. CTA audit

### D.1 Enterprise page CTAs

| Control | Label source | href | Canonical? |
|---------|--------------|------|------------|
| Primary | `public.enterprise.ctaSales` ("Contact sales") | `/contact` | ❌ Non-canonical label |
| Secondary | `public.cta.getPresentation` | `/contact` | ✅ Key canonical; placement inline only |
| Launch pilot | — | — | ❌ **Missing** |
| Contact us (`public.cta.contactUs`) | — | — | ❌ **Missing** (replaced by "Contact sales") |
| Footer `PublicCTASection` | — | — | ❌ **Missing** |

### D.2 Cross-page CTA hierarchy

| Page | Launch pilot | Contact us | Get presentation | Legacy sales label |
|------|--------------|------------|------------------|-------------------|
| Contact | ✅ floating | ✅ | ✅ | ❌ |
| Pricing | ✅ floating | ✅ | ✅ | ❌ |
| Features / Platform / Mobile / AI / Copilot / About / FAQ | ✅ floating | ✅ | ✅ | ❌ |
| **Enterprise** | ❌ | ❌ (uses `ctaSales`) | ✅ inline | ⚠️ **`ctaSales`** |

**Finding:** Enterprise is the **only modernized-nav page** still using a sales-specific CTA label instead of `public.cta.*` trio — breaks conversion governance from PRE-LG32 / LG-3.3.

### D.3 Demo-language check

| Pattern | Enterprise |
|---------|------------|
| Request Demo / Book Demo / Schedule Demo | ✅ Absent |
| `ctaSales` | Present — not demo language, but **non-canonical conversion copy** |

---

## E. Pricing conflict check

### E.1 Boundary rule (post LG-3.3)

| Surface | Owns |
|---------|------|
| **Pricing** | Commercial engagement — pilot, rollout, multi-project deployment, **enterprise evaluation** (as engagement model) |
| **Enterprise** | Enterprise **readiness** — governance, SSO/scale evaluation topics, organizational fit |

**Must not collide:** Pricing ≠ enterprise capabilities page; Enterprise ≠ pricing page.

### E.2 Current conflicts

| ID | Conflict | Severity | Detail |
|----|----------|----------|--------|
| PC-01 | **Promise gap** | **P1** | Pricing `enterpriseEvaluationDesc` cites SSO, scale, retention → links `/enterprise`; Enterprise delivers opaque tiles, not evaluation framing |
| PC-02 | **Capability vs commercial** | **P1** | Enterprise `s1`/`s8` read as **what you buy** (capabilities/support), not **how readiness is assessed** — blurs Pricing "what's included" |
| PC-03 | **Conversion path split** | **P2** | Pricing routes evaluation here; Enterprise has no link back to Pricing commercial process or Contact evaluation intake |
| PC-04 | **Pricing language** | ✅ Clear | No $ amounts, tiers, or per-seat copy on Enterprise — good |
| PC-05 | **Subscribe dashboard** | **P3** | `subscriptionOnboarding.plans.enterprise` is private billing — not public pricing; name collision only |

### E.3 Resolution direction (audit-only — for LG-3.4 implementation)

- Reframe Enterprise sections as **readiness evaluation dimensions** (governance, security posture, scale, AI governance, integration fit) with **one-line scope + link** to peer pages — not second catalog.
- Add **related strip**: Pricing (commercial path), Contact (evaluation discussion), Security/FAQ (trust depth), Platform (stack context).
- Replace `ctaSales` with canonical **`public.cta.*` floating section** including Launch pilot.

---

## F. IA recommendation (for future implementation — not in scope today)

### F.1 Target information architecture

| Section | Component (recommended) | Ownership focus |
|---------|-------------------------|-----------------|
| A. Hero | `PublicPageHero` compact | "Enterprise readiness" — distinct from Platform hero |
| B. Readiness dimensions | `PublicFeatureGrid` (solid + 1 highlight) | Governance, security, scale, AI governance, integrations fit — **with link-outs** |
| C. Evaluation process | `PublicTimelineSection` | How enterprise buyers assess fit (distinct from Pricing **commercial** timeline) |
| D. Trust summary | `PublicProofSection` stat-row | Qualitative readiness signals — **no fake certifications or metrics** |
| E. Related pages | Solid cards | **Pricing**, Contact, Platform, Security or FAQ |
| F. CTA | `PublicCTASection` floating | `public.cta.launchPilot` / `contactUs` / `getPresentation` |

### F.2 Content strategy

- **Delete or refactor** opaque `s1`–`s8` / `r1`–`r4` into named enterprise keys with `*Desc` and explicit "see Features for catalog" deferrals.
- **Remove hardcoded** section headings — move to `public.enterprise.*`.
- **Do not** restate Features module list; **do** answer SSO/scale/retention evaluation questions Pricing introduces.
- **Glass budget:** GlassNav + 1 highlight + floating CTA = 3 nodes (align with LG-2+ governance).

### F.3 i18n target

- Expand from 18 → ~50–65 keys (hero, sections, tile desc, related, CTA block).
- Remove `ctaSales`; use `public.cta.*` only.
- Align IT/ES metaDescription depth with EN.

---

## G. Risks (P0–P3)

| ID | Risk | Severity | Blocks redesign start? |
|----|------|----------|------------------------|
| R-01 | Hardcoded English h2 section titles | **P1** | Yes — i18n violation |
| R-02 | No canonical CTA trio / missing Launch pilot | **P1** | Yes — conversion governance |
| R-03 | Pricing evaluation promise under-delivered on landing | **P1** | Yes — inbound link from LG-3.3 Pricing |
| R-04 | Capability tiles duplicate Features/Platform/FAQ | **P1** | Yes — ownership failure |
| R-05 | `heroTitle` duplicates Platform positioning | **P2** | Should fix in redesign |
| R-06 | Legacy shell — no shared public components | **P2** | Design system debt |
| R-07 | Internal duplicate r1 vs s2 (role access) | **P2** | Content quality |
| R-08 | `/implementation` overlap via s8 | **P2** | Boundary |
| R-09 | `/security` overlap via s4 without link | **P2** | Boundary |
| R-10 | 0 glass nodes vs peer pages | **P3** | Consistency |
| R-11 | IT/ES metaDescription thinner than EN | **P3** | Copy parity |
| R-12 | `subscriptionOnboarding.plans.enterprise` name collision | **P3** | Document only |

**No P0 fake-pricing or customer-finance exposure** on Enterprise page.

---

## H. Final verdict

The `/enterprise` route **does not yet own enterprise readiness** in a way that is distinct from Platform, Features, FAQ, Security, Pricing, or Contact. It remains a **pre–LG-2B legacy shell** with hardcoded English, non-canonical CTAs, opaque duplicate tiles, and a **broken promise** to LG-3.3 Pricing's enterprise evaluation link-in.

# ENTERPRISE NOT READY

Ready for **LG-3.4 implementation phase** (redesign) after this audit. No page edits performed in this phase.
