# LG-4.0 API — Audit

**Route:** `/[locale]/api`  
**File:** `apps/web/app/[locale]/(public)/api/page.tsx`

---

## 1. Current state

| Attribute | Assessment |
|-----------|------------|
| Architecture | Legacy hero + available list + DX bullets + mock code block |
| LG compliance | ❌ |
| CTA compliance | ❌ **`ctaAccess` / `ctaEnterprise`** |
| Glass compliance | 0 nodes |
| i18n | 18 keys + **hardcoded English endpoint list in TSX** |
| Hardcoded EN | ✅ **“Code examples (mock)”** + raw REST paths |
| Duplication | Medium — Features `api` tile, Integrations catApi |

---

## 2. Ownership

**Unique question:** “How do developers and integrators access AISTROYKA programmatically?”

**Should NOT own:** vendor category catalog (Integrations), capability list without API lens (Features), enterprise readiness (Enterprise).

---

## 3. Duplication map

| Content | Peer | Classification |
|---------|------|----------------|
| av1–av7 resource list | Features apiDesc | **REWRITE** — API-specific scope |
| dxAuth–dxSandbox | Integrations archBody | **KEEP** DX section |
| positioning early access | Pricing, Enterprise | **REWRITE** — honest gating |
| mock code block | — | **REWRITE** — i18n or link to docs when exists |

**Route verdict:** **REWRITE**

---

## 4. CTA audit

| Control | Status |
|---------|--------|
| Launch pilot | ❌ |
| Contact us | ❌ |
| Get presentation | ❌ |
| Request API access / Talk to enterprise team | ⚠️ Non-canonical |

---

## 5. IA recommendation

| Element | Recommendation |
|---------|----------------|
| Hero | `PublicPageHero` — developer / integrator entry |
| Sections | `PublicFeatureGrid` — available resources; DX panel |
| Code | i18n mock examples or “docs coming” — no hardcoded EN |
| Related | Integrations, Features, Enterprise, Contact |
| CTA | Canonical floating trio |
| Glass | 1 highlight on API access / early partner path |

---

## 6. Risks

| ID | Risk | Severity |
|----|------|----------|
| A-01 | Features links here | P1 |
| A-02 | Hardcoded mock endpoints imply public API | P1 |
| A-03 | Non-canonical CTAs | P1 |
| A-04 | Overlap Integrations catApi | P2 |
