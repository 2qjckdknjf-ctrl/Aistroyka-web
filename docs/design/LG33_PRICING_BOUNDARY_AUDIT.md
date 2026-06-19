# LG-3.3 Pricing — Boundary Audit

**Date:** 2026-06-18  
**Phase:** LG-3.3 — Architecture audit (pre-implementation baseline)  
**Branch:** `design/liquid-glass-public-shell-lg2a`  
**Route:** `/[locale]/pricing`  
**Prerequisite:** LG-3.2 Features closed (`22d3d155`), PRE-LG32 demo CTA eradication (`64fe6630`)

---

## 1. Current state (`/pricing`) — pre-LG-3.3

### 1.1 Implementation snapshot

| Attribute | Legacy state |
|-----------|--------------|
| **File** | `apps/web/app/[locale]/(public)/pricing/page.tsx` |
| **Pattern** | Pre–LG-2B legacy: inline tier cards, no shared public components |
| **Layout** | Single column, four fake plan cards (Starter / Pro / Business / Enterprise) |
| **i18n** | `public.pricing.*` with tier keys (`starter`, `pro`, `business`, `enterprise`, `*Desc`, `requestQuote`) |
| **Glass** | None |
| **CTA** | Per-card `requestQuote` — no canonical footer CTA |
| **Nav** | Primary nav + footer link present |

### 1.2 Commercial risk (P0)

| Risk | Severity | Detail |
|------|----------|--------|
| **Fake list pricing** | **P0** | Four subscription-style tiers implied fixed SKUs without backend or Stripe public checkout |
| **Enterprise capability duplication** | **P1** | Enterprise tier card described SSO/scale — belongs on `/enterprise` |
| **Pilot-first contradiction** | **P0** | Self-serve tier grid contradicts product strategy (scoped pilots, custom deployment) |
| **Legal/commercial** | **P1** | Published tier names without binding terms creates expectation mismatch |

### 1.3 Hero (legacy)

| Element | Issue |
|---------|-------|
| **h1** | Generic "Pricing" |
| **Body** | `metaDescription` reused as visible copy |
| **Positioning** | Implied SaaS checkout, not commercial engagement |

### 1.4 CTA structure (legacy)

| Tier | Present? |
|------|----------|
| Launch pilot | ❌ |
| Contact us | ❌ (only `requestQuote` per card) |
| Get presentation | ❌ |
| Request Demo / Book Demo | ✅ Absent (cleaned PRE-LG32) |

### 1.5 Overlap scan

| Peer | Overlap severity | Detail |
|------|------------------|--------|
| **Enterprise** | **High** | Enterprise tier card duplicated readiness topics (SSO, scale) |
| **Contact** | **Medium** | `requestQuote` duplicated Contact conversion without process framing |
| **Features** | **Medium** | Tier descriptions listed product modules as plan differentiators |
| **Platform / Mobile / AI / Copilot** | **Low** | No dedicated pricing depth pages — overlap was via fake tier feature lists |
| **Homepage** | **Medium** | `pricingTeaser*` implied "plans for every scale" (pre-fix) |

---

## 2. Ownership decision

### 2.1 Canonical question

**"What commercial engagement models exist?"**

### 2.2 Assigned ownership — `/pricing`

| Owns | Does NOT own |
|------|--------------|
| Pilot engagement | Enterprise capabilities (→ `/enterprise`) |
| Project rollout | Platform architecture (→ `/platform`) |
| Multi-project deployment | Capability catalog (→ `/features`) |
| Enterprise evaluation (link-out) | AI pipeline depth (→ `/ai-construction-control`) |
| What's included (commercial packaging) | Copilot workflow (→ `/copilot`) |
| Commercial process timeline | Contact form workflow (→ `/contact`) |
| Trust / no list pricing | Implementation process (→ future `/implementation`) |
| Related page routing | Demo workflow |

### 2.3 Page boundary matrix

| Page | Question answered |
|------|-------------------|
| Homepage | Outcome |
| Platform | Stack map |
| Features | Capability catalog |
| Mobile | Field workflow |
| AI Control | Intelligence engine |
| Copilot | Assistant |
| About | Mission |
| FAQ | Objections |
| **Pricing** | **Commercial packaging** |
| Enterprise | Enterprise readiness |
| Contact | Conversion |

---

## 3. Demo-language audit (marketing surface)

| Pattern | Pricing | Other public pages |
|---------|---------|-------------------|
| Request Demo | ✅ Absent | ✅ Absent |
| Book Demo | ✅ Absent | ✅ Absent |
| Schedule Demo | ✅ Absent | ✅ Absent |
| Enterprise Demo | ✅ Absent | ✅ Absent |

**Note:** `public.nav.aiDemo` / `/ai-demo` is an **interactive product mock**, not a sales-demo CTA — out of scope for LG-3.3 demo eradication.

---

## 4. Required IA (target)

| Section | Component | Purpose |
|---------|-----------|---------|
| A. Hero | `PublicPageHero` compact | Pilot-first commercial engagement |
| B. Engagement models | `PublicFeatureGrid` | Pilot, project rollout, multi-project, enterprise evaluation |
| C. What's included | `PublicFeatureGrid` | Platform, Mobile, Construction AI, Copilot, Support, Onboarding |
| D. Commercial process | `PublicTimelineSection` | Discovery → Pilot → Validation → Rollout → Expansion |
| E. Trust | `PublicProofSection` stat-row | Qualitative — no fake numbers |
| F. Related pages | Solid cards | Platform, Features, Contact, Enterprise |
| G. CTA | `PublicCTASection` floating | `public.cta.*` canonical trio |

**Glass budget:** GlassNav + 1 highlight card + floating CTA = **3 nodes max**.

---

## 5. Audit verdict (pre-implementation)

| Finding | Action |
|---------|--------|
| Fake tier grid | **Replace** with engagement models |
| Tier i18n keys | **Remove** dead keys |
| No canonical CTA | **Add** `PublicCTASection` |
| Enterprise overlap | **Link** enterprise evaluation → `/enterprise` |
| Home teaser misalignment | **Rewrite** pilot-first copy |
| Demo sales language | **None** — no action |

**Boundary audit status:** Complete — ready for implementation per LG-3.3 scope.
