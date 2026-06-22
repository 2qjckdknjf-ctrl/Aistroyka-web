# LG-4.0 Workflows — Audit

**Route:** `/[locale]/workflows`  
**File:** `apps/web/app/[locale]/(public)/workflows/page.tsx`

---

## 1. Current state

| Attribute | Assessment |
|-----------|------------|
| Architecture | Legacy centered hero + example list + benefit grid |
| LG compliance | ❌ |
| CTA compliance | ⚠️ **Contact us only** — missing Launch pilot + Get presentation |
| Glass compliance | 0 nodes |
| i18n | 14 keys; benefit tiles title-only |
| Duplication | **High** — overlaps notifications, AI summaries, manager review flows |

---

## 2. Ownership

**Unique question:** “What operational automations and alert paths does AISTROYKA support?”

**Risk:** Current copy implies **workflow automation engine** (issue → notify, overdue → escalate) that may exceed marketed product scope.

**Should NOT own:** AI pipeline (AI Control), assistant chat (Copilot), platform stack (Platform), implementation phases.

---

## 3. Duplication map

| Workflows content | Peer | Classification |
|-------------------|------|----------------|
| ex4 Report → AI summary | Copilot, AI Control | **REWRITE** — frame as supported paths, not generic automation |
| ex1–ex3, ex5 alerts/escalations | Platform notifications, manager inbox | **REWRITE** with honest scope |
| b1–b4 benefits | Home outcome, About principles | **MERGE** or remove generic benefits |
| Integrations `ctaWorkflow` | “Request custom workflow” | **REWRITE** CTAs to canonical |

**Route verdict:** **REWRITE** — consider **MERGE** sections into Platform “operational loop” if automation scope is narrow.

---

## 4. CTA audit

| Control | Status |
|---------|--------|
| Launch pilot | ❌ |
| Contact us | ✅ inline |
| Get presentation | ❌ |
| Request Demo / Sales | ✅ Absent |

---

## 5. IA recommendation

| Element | Recommendation |
|---------|----------------|
| Hero | `PublicPageHero` — “Operational workflows” with scope disclaimer |
| Sections | `PublicFeatureGrid` — trigger → action examples with honest “today vs roadmap” |
| Timeline | Optional `PublicTimelineSection` — report → review → approval loop (links Mobile, AI Control) |
| Related | Platform, Copilot, Contact, Enterprise |
| CTA | Canonical floating trio |
| Glass | 1 highlight on primary workflow example |

---

## 6. Risks

| ID | Risk | Severity |
|----|------|----------|
| W-01 | Overpromises automation vs product truth | **P0** if capabilities not shipped |
| W-02 | Partial CTA hierarchy | P1 |
| W-03 | Overlaps Copilot/AI Control without boundary | P1 |
| W-04 | Nav surface with weak inbound | P2 |
