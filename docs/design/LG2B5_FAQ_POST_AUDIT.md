# LG-2B.5 FAQ Post-Audit

**Date:** 2026-06-18  
**Phase:** LG-2B.5 — FAQ page redesign  
**Route:** `/[locale]/faq`

---

## Closure checklist

| # | Question | Answer | Evidence |
|---|----------|--------|----------|
| 1 | FAQ answers adoption objections? | **YES** | 16 Q&A across 3 sections |
| 2 | No duplicated page ownership? | **YES** | Pointers to platform/mobile/copilot, not rewrites |
| 3 | Request Demo removed from FAQ? | **YES** | Pricing FAQ removed; `public.cta.*` only |
| 4 | Glass budget ≤ 2? | **YES** | Hero + CTA only |
| 5 | FAQ cards solid? | **YES** | `variant="faq"` — no glass accordions |
| 6 | i18n complete (4 locales)? | **YES** | en/ru/es/it + full-tree check |
| 7 | Customer-finance boundary in owner FAQ? | **YES** | `opsOwnerProgressA` |
| 8 | Validation pass? | **YES** | See below |

---

## Validation results (2026-06-18)

| Command | Result |
|---------|--------|
| `bun run --cwd apps/web check:design` | **PASS** |
| `bun run lint` | **PASS** |
| `tsc --noEmit` | **PASS** |
| `bun run i18n:check` | **PASS** |
| `I18N_CHECK_ALL=1 bun run i18n:check` | **PASS** |
| `bun run build` | **PASS** |
| `bun run cf:build` | **PASS** |

---

## Remaining risks

| ID | Severity | Item | Blocks closure? |
|----|----------|------|-----------------|
| VISUAL-MANUAL | **P3** | No automated visual regression for `/faq` | No |
| PRICING-ELSEWHERE | **P3** | Pricing page still has legacy demo language — separate phase | No |
| NO-ACCORDION | **P3** | Long FAQ page scroll vs collapsible — intentional for a11y | No |

**P0:** none  
**P1:** none  
**P2:** none

---

## Final verdict

# LG-2B.5 CLOSED

Do not commit unless explicitly requested.
