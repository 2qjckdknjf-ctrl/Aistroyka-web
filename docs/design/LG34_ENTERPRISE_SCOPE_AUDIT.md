# LG-3.4 Enterprise — Scope Audit

**Date:** 2026-06-18  
**Phase:** LG-3.4 — Audit only  
**Route:** `/[locale]/enterprise`  
**Authority:** Principal Product Architect + Enterprise Positioning Auditor + Design Governance

---

## 1. Audit scope (this phase)

| In scope | Status |
|----------|--------|
| `/enterprise` page architecture | ✅ Audited |
| Cross-page comparison vs Home, Platform, Features, Mobile, AI Control, Copilot, About, FAQ, Contact, Pricing | ✅ Complete |
| Ownership question | ✅ Answered |
| Duplication map (content, CTAs, trust, features, pricing, platform) | ✅ Documented |
| Pricing vs Enterprise conflict check | ✅ Documented |
| CTA / demo-language scan | ✅ Complete |
| IA recommendation (future) | ✅ Documented — **no implementation** |
| Risk register P0–P3 | ✅ Documented |
| Output docs | ✅ `LG34_ENTERPRISE_BOUNDARY_AUDIT.md`, this file |

---

## 2. Explicitly out of scope (this phase)

| Item | Reason |
|------|--------|
| Page redesign | User mandate: audit only |
| `enterprise/page.tsx` edits | Prohibited |
| i18n changes | Prohibited |
| Commits | Prohibited |
| `/implementation`, `/integrations`, `/partners` redesign | Separate legacy routes — referenced only where Enterprise duplicates |
| Dashboard `subscriptionOnboarding` | Private billing — not public enterprise marketing |
| `/security` page redesign | Peer reference for duplication analysis only |

---

## 3. Comparison matrix (modernized vs legacy)

| Route | LG phase | Shared public components | Canonical CTA trio | Inbound → Enterprise |
|-------|----------|--------------------------|--------------------|----------------------|
| Homepage | LG-2+ | ✅ | ✅ band | ❌ |
| Platform | LG-3.0 | ✅ | ✅ floating | ❌ |
| Features | LG-3.2 | ✅ | ✅ floating | ❌ |
| Mobile | LG-3.x | ✅ | ✅ floating | ❌ |
| AI Control | LG-3.1 | ✅ | ✅ floating | ❌ |
| Copilot | LG-3.x | ✅ | ✅ floating | ❌ |
| About | LG-3.x | ✅ | ✅ floating | ❌ |
| FAQ | LG-3.x | ✅ | ✅ floating | ❌ |
| Contact | LG-3.x | ✅ | ✅ floating | ❌ |
| Pricing | LG-3.3 | ✅ | ✅ floating | ✅ **Only modernized inbound** |
| **Enterprise** | **Pre-LG-2B** | ❌ | ❌ | — |

**Governance gap:** Enterprise is the **last primary-nav public page** without liquid-glass public shell alignment.

---

## 4. Ownership scope (future implementation)

When LG-3.4 implementation runs, scope should include:

| Must implement | Must defer (link only) |
|--------------|------------------------|
| Enterprise readiness hero (distinct from Platform) | Feature module catalog |
| Evaluation dimensions with descriptions | AI pipeline depth |
| Enterprise evaluation process timeline | Contact form |
| Trust/readiness summary (qualitative) | Implementation phase detail |
| Related cards: Pricing, Contact, Platform, FAQ/Security | Integrations vendor catalog |
| `public.cta.*` floating CTA | Commercial engagement models |
| Full `public.enterprise.*` i18n (4 locales) | Pricing amounts / tiers |
| Glass budget ≤ 3 nodes | Demo/sales funnel language |

---

## 5. Pricing boundary (scope for implementation)

### 5.1 Pricing owns (unchanged — LG-3.3)

- Pilot, project rollout, multi-project deployment, enterprise evaluation **as engagement models**
- Commercial process: Discovery → Pilot → Validation → Rollout → Expansion
- No list pricing

### 5.2 Enterprise must own (implementation target)

- **Readiness topics** referenced by Pricing `enterpriseEvaluationDesc`: SSO, scale, retention, enterprise requirements
- **Organizational governance** narrative (multi-project/multi-site at org level)
- **Buyer evaluation checklist** framing — not checkout

### 5.3 Documented conflicts to resolve in implementation

| Conflict | Fix direction |
|----------|---------------|
| Pricing links in, Enterprise doesn't reciprocate | Add Pricing related card |
| Enterprise tiles = product catalog | Reframe as readiness dimensions + link-outs |
| `ctaSales` vs `public.cta.contactUs` | Remove `ctaSales`; adopt canonical trio |
| s8 vs `/implementation` | Link to Implementation; don't duplicate phases on Enterprise |

---

## 6. CTA scope audit

| CTA pattern | Enterprise today | Required for closure |
|-------------|------------------|----------------------|
| `public.cta.launchPilot` | Missing | Required |
| `public.cta.contactUs` | Missing (replaced by ctaSales) | Required |
| `public.cta.getPresentation` | Present inline | Move to floating section |
| `PublicCTASection` | Missing | Required |
| Request Demo / Book Demo | Absent | Keep absent |

---

## 7. i18n scope (future)

| Item | Current | Target |
|------|---------|--------|
| Leaf keys | 18 | ~50–65 |
| Section headings in TSX | 2 hardcoded EN strings | 0 — all in messages |
| `ctaSales` | Present | Remove |
| Tile descriptions | None | Add `*Desc` per tile |
| Full-tree parity | Keys match across 4 locales | Maintain after expansion |

---

## 8. Dependencies

| Dependency | Status |
|------------|--------|
| LG-3.3 Pricing closed (engagement + evaluation link-out) | ✅ Design complete; defines inbound promise |
| Canonical `public.cta.*` | ✅ Stable |
| Shared `@/components/public/*` | ✅ Available |
| `/security` page | Legacy but usable link target |
| `/implementation` page | Legacy — link deferral recommended |

---

## 9. Risk summary (scope view)

| Severity | Count | Examples |
|----------|-------|----------|
| **P0** | 0 | No fake enterprise pricing on public page |
| **P1** | 4 | Hardcoded EN, CTA governance, Pricing promise gap, catalog duplication |
| **P2** | 5 | Platform hero overlap, legacy shell, internal duplicates, Implementation/Security overlap |
| **P3** | 3 | Glass consistency, meta copy parity, subscribe plan name collision |

---

## 10. Scope verdict

Audit scope is **complete**. Findings are sufficient to begin **LG-3.4 Enterprise implementation** as a separate phase.

# ENTERPRISE NOT READY

Boundary and scope audits do **not** authorize production page changes until implementation phase is explicitly opened.
