# LG-4.0 Implementation — Audit

**Route:** `/[locale]/implementation`  
**File:** `apps/web/app/[locale]/(public)/implementation/page.tsx`

---

## 1. Current state

| Attribute | Assessment |
|-----------|------------|
| Architecture | Legacy hero + numbered phase list + explain block |
| LG compliance | ❌ |
| CTA compliance | ❌ **`ctaPlan` / `ctaConsult`** — non-canonical |
| Glass compliance | 0 nodes |
| i18n | 12 keys; phase labels only (no Desc) |
| Hardcoded EN | ✅ **“Phases”** h2 |
| Duplication | **High** vs Contact pilot process, Pricing commercial process, Enterprise evaluation |

---

## 2. Ownership

**Unique question:** “How is AISTROYKA deployed, configured, and onboarded across phases?”

**Boundary rule:** Must differ from:

- **Contact** — conversion + pilot intake form
- **Pricing** — commercial engagement models
- **Enterprise** — organizational readiness evaluation

---

## 3. Duplication map

| Content | Peer | Classification |
|---------|------|----------------|
| phase1 Discovery | Pricing stepDiscovery, Contact stepDiscovery | **REWRITE** — implementation-specific depth |
| phase4 Team onboarding | Contact stepTeamOnboarding | **MERGE** link Contact |
| phase5 Pilot launch | Contact, Pricing pilot | **MERGE** link-out |
| phase6 Scale rollout | Pricing rollout, Enterprise expansion | **MERGE** link-out |
| explainDuration/Needs | Contact hero, Pricing process | **REWRITE** with deployment specifics |

**Route verdict:** **REWRITE** with strict boundary vs Contact/Pricing/Enterprise.

---

## 4. CTA audit

| Control | Status |
|---------|--------|
| Launch pilot | ❌ |
| Contact us | ❌ (custom labels) |
| Get presentation | ❌ |
| Plan implementation / Request onboarding consultation | ⚠️ Non-canonical |

---

## 5. IA recommendation

| Element | Recommendation |
|---------|----------------|
| Hero | `PublicPageHero` — “Implementation & onboarding” |
| Sections | `PublicTimelineSection` — 6 phases with Desc (deployment focus) |
| Split callout | Solid card — “Commercial terms → Pricing; start pilot → Contact” |
| Related | Contact, Pricing, Enterprise, Platform |
| CTA | Canonical floating trio |
| Glass | 1 highlight on pilot launch phase |

---

## 6. Risks

| ID | Risk | Severity |
|----|------|----------|
| IM-01 | Enterprise links here — weak target | **P1** |
| IM-02 | Timeline collision with Pricing/Contact | P1 |
| IM-03 | Non-canonical CTAs | P1 |
| IM-04 | Hardcoded “Phases” | P2 |
