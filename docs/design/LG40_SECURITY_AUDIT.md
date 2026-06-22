# LG-4.0 Security — Audit

**Route:** `/[locale]/security`  
**File:** `apps/web/app/[locale]/(public)/security/page.tsx`

---

## 1. Current state

| Attribute | Assessment |
|-----------|------------|
| Architecture | Legacy single column; 5 stacked sections with Body keys |
| LG compliance | ❌ |
| CTA compliance | ❌ **No CTAs** |
| Glass compliance | 0 nodes |
| i18n | 11 keys; **`metaDescription` as visible body** |
| Duplication | **Medium** — FAQ trust, About trust, Enterprise security grid |

---

## 2. Ownership

**Unique question:** “How is customer data protected — encryption, AI safety, infrastructure, and vendor posture?”

**Should NOT own:** enterprise readiness evaluation (Enterprise), objection Q&A format (FAQ), mission/trust principles (About).

---

## 3. Duplication map

| Section | Peer | Classification |
|---------|------|----------------|
| dataProtectionBody | FAQ trustAccessControl, Enterprise secDataHandling | **KEEP** — Security owns depth |
| aiSafetyBody | AI Control trust, FAQ trustAiAutonomous | **KEEP** summary + link AI Control |
| supabaseSecurity / cloudflare | — | **KEEP** — unique infra detail |
| metaDescription as intro | — | **REWRITE** — proper hero |

**Route verdict:** **REWRITE** — **KEEP** route (required Enterprise link target).

---

## 4. CTA audit

| Control | Status |
|---------|--------|
| Launch pilot | ❌ |
| Contact us | ❌ |
| Get presentation | ❌ |
| Sales / Demo language | ✅ Absent |

---

## 5. IA recommendation

| Element | Recommendation |
|---------|----------------|
| Hero | `PublicPageHero` — “Security & data protection” |
| Sections | `PublicFeatureGrid` or stacked cards — 5 topics with Body in i18n |
| Trust | `PublicProofSection` qualitative — no fake certifications |
| Related | Enterprise, FAQ, About, Contact |
| CTA | Canonical floating trio |
| Glass | 1 highlight on data protection |

---

## 6. Risks

| ID | Risk | Severity |
|----|------|----------|
| SE-01 | Enterprise secDataHandling links here | **P1** |
| SE-02 | No conversion CTA on trust page | P1 |
| SE-03 | Overlap FAQ without differentiation | P2 |
| SE-04 | metaDescription as body | P2 |
