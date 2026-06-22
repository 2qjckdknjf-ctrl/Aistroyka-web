# LG-4.0 Integrations — Audit

**Route:** `/[locale]/integrations`  
**File:** `apps/web/app/[locale]/(public)/integrations/page.tsx`

---

## 1. Current state

| Attribute | Assessment |
|-----------|------------|
| Architecture | Legacy category grid + architecture blurb |
| LG compliance | ❌ |
| CTA compliance | ❌ **`ctaEnterprise` / `ctaWorkflow`** — non-canonical |
| Glass compliance | 0 nodes |
| i18n | 18 keys; status Planned/Progress/Available |
| Hardcoded EN | ✅ **“Integration categories”** h2 in TSX |
| Duplication | Medium with Features connectivity section |

---

## 2. Ownership

**Unique question:** “What systems can connect to AISTROYKA — categories, readiness, and connection patterns?”

**Should NOT own:** full API reference (API page), enterprise readiness (Enterprise), commercial engagement (Pricing).

---

## 3. Duplication map

| Content | Peer | Classification |
|---------|------|----------------|
| catErp–catApi categories | Features `integrations` / `api` tiles | **REWRITE** — Integrations owns depth; Features keeps teaser |
| archBody API-first | Features `apiDesc`, API page | **KEEP** summary + link API |
| status badges | — | **KEEP** if honest; **REWRITE** if overstated |
| ctaEnterprise | Contact conversion | **REWRITE** → `public.cta.*` |

**Route verdict:** **REWRITE** — **highest priority legacy route** (Features inbound).

---

## 4. CTA audit

| Control | Status |
|---------|--------|
| Launch pilot | ❌ |
| Contact us | ❌ (via custom labels → `/contact`) |
| Get presentation | ❌ |
| Discuss enterprise integration | ⚠️ Custom — not canonical |
| Request custom workflow | ⚠️ Custom — overlaps Workflows |

---

## 5. IA recommendation

| Element | Recommendation |
|---------|----------------|
| Hero | `PublicPageHero` — connectivity / vendor categories |
| Sections | `PublicFeatureGrid` — categories with status + honest Desc |
| Architecture | Solid panel or `PublicProofSection` — tenant-safe adapters |
| Related | Features, API, Platform, Enterprise, Contact |
| CTA | Canonical floating trio |
| Glass | 1 highlight on API/webhooks category |

---

## 6. Risks

| ID | Risk | Severity |
|----|------|----------|
| I-01 | Features links to weak destination | **P1** |
| I-02 | Status labels may overstate availability | **P1** |
| I-03 | Non-canonical CTAs | P1 |
| I-04 | Hardcoded English h2 | P2 |
