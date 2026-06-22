# PRE-LG-3.2 No-Tail Report

**Date:** 2026-06-18  
**Authority:** Principal Architecture Auditor + Product Marketing Lead + Technical Debt Closure  
**Gate:** Final tail closure before LG-3.2 Features implementation

---

## A. Findings

### Request Demo audit

- **P1 resolved:** Modernized wave had one remaining sales-demo string — `public.aiControl.linkAiDemo` ("Try interactive demo"). Rewritten to mock-analysis language in all four locales.
- **P2 resolved:** Legacy routes workflows, pricing, and enterprise still exposed Request Demo / Book demo / Enterprise demo CTAs. All rewired to `public.cta.contactUs` or `public.cta.getPresentation`.
- **KEEP (documented):** `/ai-demo` product route, `public.nav.aiDemo`, and `public.aiDemo.*` namespace — product mock surface, not sales-demo funnel.

### CTA audit

- Eight modernized pages + home conform to **Launch pilot / Contact us / Get presentation** via `PublicHeroCTA` and `PublicCTASection`.
- Pricing and enterprise use page-specific primaries (`requestQuote`, `ctaSales`) with canonical tertiary — acceptable P3 deviation.

### Navigation audit

- **Fixed:** `public.nav.copilot` aligned to **Copilot** across en/ru/es/it (was AI Copilot / Copilot IA / ИИ-копилот).
- **Verified:** Construction AI, Platform, Mobile, Features, About, FAQ, Contact labels match target IA.

### i18n audit

- **Removed 7 orphan key groups** across 4 locales (demo CTAs, unused home hero CTAs, duplicate nav launchPilot/tryPlatform).
- **Full-tree parity:** 2985 leaf keys — PASS.

### Glass audit

- Home: **6/6** nodes (at budget cap).
- Platform, Mobile, Copilot, About, AI Control: **4/4** each.
- FAQ, Contact: **3/4** each.
- **Zero violations.**

### Accessibility audit

- Single h1, focus rings, CTA aria labels, keyboard nav patterns — **PASS** on modernized wave.
- No new overflow or touch-target regressions identified.

### Content overlap audit

- Home ↔ Features, Platform ↔ Features overlaps classified **MERGE (LG-3.2)** — not actioned in this pass.
- Cross-page teasers (home → AI Control / Mobile) classified **KEEP**.

---

## B. Fixes applied

1. Rewrote AI Control related mock link copy (removed sales-demo wording).
2. Workflows footer → Contact us.
3. Pricing plan cards → Get presentation; meta descriptions de-demo'd.
4. Enterprise secondary CTA → Get presentation.
5. Nav Copilot label normalized.
6. Removed orphan i18n keys (demo + dead home CTAs + nav duplicates).

**Not done (by mandate):** LG-3.2 Features page redesign, `/ai-demo` rename, enterprise section i18n.

---

## C. Remaining risks

| ID | Risk | Severity | Blocks LG-3.2? |
|----|------|----------|----------------|
| R-01 | `/features` still legacy layout/copy | P2 product | No — LG-3.2 scope |
| R-02 | `/ai-demo` retains product "demo" naming | P3 | No |
| R-03 | Home pricing teaser non-canonical CTA label | P3 | No |
| R-04 | Enterprise EN-hardcoded h2 section titles | P3 | No |
| R-05 | Header lacks Launch pilot (page bodies have it) | P3 | No |

---

## D. Validation

| Gate | Exit |
|------|------|
| `check:design` | 0 |
| `lint` | 0 |
| `tsc --noEmit` | 0 |
| `i18n:check` | 0 |
| `I18N_CHECK_ALL=1 i18n:check` | 0 |
| `build` | 0 |
| `cf:build` | 0 |

---

## E. Verdict

### **READY FOR LG-3.2**

The public marketing layer has no P1/P2 demo-CTA or CTA-architecture tails on the LG-2B + LG-3.1 wave. Remaining items are P3 and explicitly deferred to LG-3.2 Features or phase-2 routes. Validation is green. Proceed to LG-3.2 Features implementation when approved — do not start in this closure pass.

---

## Related docs

- `docs/design/PRE_LG32_TAIL_CLOSURE_AUDIT.md` — detailed task workbook
- `docs/design/LG32_FEATURES_BOUNDARY_AUDIT.md` — Features boundary (audit only)
- `docs/design/LG32_FEATURES_SCOPE_AUDIT.md` — Features scope (audit only)
