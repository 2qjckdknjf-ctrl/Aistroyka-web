# LG-4.0 AI Demo — Audit

**Route:** `/[locale]/ai-demo`  
**Files:** `ai-demo/page.tsx`, `ai-demo/AiDemoSimulator.tsx` (client)

---

## 1. Current state

| Attribute | Assessment |
|-----------|------------|
| Architecture | Legacy hero + **client simulator** + capability grid |
| LG compliance | ❌ shell; simulator uses design tokens |
| CTA compliance | ⚠️ **“Try AI demo”** scroll CTA only — not canonical trio |
| Glass compliance | 0 nodes |
| i18n | ~25+ keys; simulator fully i18n |
| Duplication | **High** with AI Construction Control (capabilities, mock analysis) |
| Inbound | AI Control related strip **“Interactive mock”** |

---

## 2. Ownership

**Unique question:** “Can I interact with a **mock** Construction AI analysis before signing up?”

**Not a sales demo** — product interactive mock with explicit `demoUsesMockOutput` disclaimer.

**Should NOT own:** AI pipeline depth (AI Control), live LLM proof, Copilot chat workflow.

---

## 3. Duplication map

| Content | Peer | Classification |
|---------|------|----------------|
| photoAnalysis, deviation, risk tiles | AI Control detection + inputs | **REPOSITION** — demo only |
| heroTitle analysis from photos | AI Control hero | **REPOSITION** — shorten; link AI Control |
| AiDemoSimulator | AI Control mock section | **KEEP** — unique interactive surface |
| capabilities grid | AI Control related content | **MERGE** into single demo section or remove grid |

**Route verdict:** **REPOSITION** (not REMOVE) — evidence:

1. AI Control explicitly links here as “Interactive mock”
2. Simulator provides **try-before-pilot** UX without claiming live AI
3. Disclaimer present: mock output, no server send
4. Nav label `aiDemo` is product education, not Request Demo sales language

**Alternative considered — REMOVE:** Would break AI Control related link; loses low-friction product proof. **Rejected** unless mock moves inline to AI Control page.

---

## 4. CTA audit

| Control | Status |
|---------|--------|
| Launch pilot | ❌ |
| Contact us | ❌ |
| Get presentation | ❌ |
| Try AI demo (`public.aiDemo.cta`) | ✅ Product demo — **KEEP** as secondary hero action |
| Request Demo / Book Demo / Contact Sales | ✅ Absent |

**Recommendation:** Add canonical `PublicCTASection` **below** simulator; keep “Try AI demo” as in-page anchor only.

---

## 5. IA recommendation

| Element | Recommendation |
|---------|----------------|
| Hero | `PublicPageHero` — “Interactive mock analysis” eyebrow; link AI Control |
| Core | **Keep** `AiDemoSimulator` — optional glass panel wrapper |
| Capabilities | **Remove or shrink** grid — defer to AI Control |
| Related | AI Construction Control, Copilot, Contact, Features |
| CTA | Canonical floating trio + in-page demo anchor |
| Glass | 1 highlight on simulator card |

---

## 6. Risks

| ID | Risk | Severity |
|----|------|----------|
| D-01 | AI Control links to legacy shell | P1 |
| D-02 | User confuses mock with live AI | P1 — mitigate with hero/subtitle |
| D-03 | Capability grid duplicates AI Control | P2 |
| D-04 | No pilot conversion footer | P1 |

---

## 7. /ai-demo disposition

# REPOSITION

Keep route; redesign as **subordinate interactive mock** under Construction AI narrative, not parallel AI marketing page.
