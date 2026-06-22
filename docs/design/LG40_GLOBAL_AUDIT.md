# LG-4.0 Global Audit — Legacy Public Routes

**Date:** 2026-06-18  
**Phase:** LG-4.0 — Audit complete  
**Branch:** `design/liquid-glass-public-shell-lg2a`  
**Last commit:** `108c7941` (LG-3.3 + LG-3.4)

---

## Executive summary

Seven legacy public routes remain **outside** the LG-2B / LG-3.x modernized shell. All fail LG compliance (shared components, canonical CTAs, glass budget). **Three routes** (Integrations, Security, Implementation) are **canonical link targets** from LG-3.x pages — creating a **P1 trust gap**. **AI Demo** should **REPOSITION**, not remove. **Workflows** carries **P0 product-truth risk** if automation claims exceed shipped scope.

---

## Routes audited

| # | Route | Verdict | Priority |
|---|-------|---------|----------|
| 1 | `/solutions` | REWRITE | P3 |
| 2 | `/workflows` | REWRITE | P2 |
| 3 | `/integrations` | REWRITE | **P1** |
| 4 | `/implementation` | REWRITE | **P1** |
| 5 | `/security` | REWRITE | **P1** |
| 6 | `/api` | REWRITE | P2 |
| 7 | `/ai-demo` | **REPOSITION** | **P1** |

---

## Global duplication map

```
Canonical (LG-3.x)          Legacy targets
─────────────────          ──────────────
Features ─────────────────► Integrations, API
Enterprise ───────────────► Security, Implementation
AI Control ───────────────► AI Demo
Home / Contact ───────────► Solutions (overlap)
Platform / Copilot ───────► Workflows (overlap)
FAQ / About ──────────────► Security (overlap)
Pricing / Contact ────────► Implementation (overlap)
```

---

## Global CTA audit

| Route | Launch pilot | Contact us | Get presentation | Non-canonical | Sales demo |
|-------|--------------|------------|------------------|---------------|------------|
| Solutions | ❌ | ❌ | ❌ | — | ✅ absent |
| Workflows | ❌ | ⚠️ | ❌ | — | ✅ absent |
| Integrations | ❌ | ❌ | ❌ | ctaEnterprise, ctaWorkflow | ✅ absent |
| Implementation | ❌ | ❌ | ❌ | ctaPlan, ctaConsult | ✅ absent |
| Security | ❌ | ❌ | ❌ | — | ✅ absent |
| API | ❌ | ❌ | ❌ | ctaAccess, ctaEnterprise | ✅ absent |
| AI Demo | ❌ | ❌ | ❌ | Try AI demo (product) | ✅ absent |

**100% of legacy routes** missing canonical floating `PublicCTASection`.

---

## Global glass audit

| Route | Glass nodes |
|-------|-------------|
| All 7 legacy | **0** (non-compliant vs LG-2+ standard of ≤3) |

---

## Global i18n audit

| Issue | Routes affected |
|-------|-----------------|
| metaDescription as body | Solutions, Security |
| Hardcoded English in TSX | Integrations, Implementation, API |
| Title-only tiles (no Desc) | Workflows benefits, Implementation phases |
| Non-canonical CTA keys | Integrations, Implementation, API |

---

## Global risks

| ID | Risk | Severity |
|----|------|----------|
| G-01 | Canonical pages link to legacy shells | **P1** |
| G-02 | Workflows automation overpromise | **P0** (content truth — verify before LG-4.6) |
| G-03 | Integrations status badges vs reality | **P1** |
| G-04 | No legacy route has canonical CTA trio | **P1** |
| G-05 | Implementation timeline vs Pricing/Contact | **P1** |
| G-06 | AI Demo mock vs live AI confusion | **P1** |
| G-07 | Solutions orphan + duplicate | P2 |
| G-08 | API hardcoded mock endpoints | P2 |
| G-09 | Footer/header nav exposes all legacy routes | P3 |

---

## Implementation sequence (summary)

| Phase | Route |
|-------|-------|
| **LG-4.1** | Integrations |
| **LG-4.2** | Security |
| **LG-4.3** | Implementation |
| **LG-4.4** | AI Demo (REPOSITION) |
| **LG-4.5** | API |
| **LG-4.6** | Workflows |
| **LG-4.7** | Solutions |

Detail: `LG40_PHASE_PLAN.md`

---

## Documents created

| Document |
|----------|
| `LG40_LEGACY_ROUTE_INVENTORY.md` |
| `LG40_SOLUTIONS_AUDIT.md` |
| `LG40_WORKFLOWS_AUDIT.md` |
| `LG40_INTEGRATIONS_AUDIT.md` |
| `LG40_IMPLEMENTATION_AUDIT.md` |
| `LG40_SECURITY_AUDIT.md` |
| `LG40_API_AUDIT.md` |
| `LG40_AI_DEMO_AUDIT.md` |
| `LG40_OWNERSHIP_MATRIX.md` |
| `LG40_PHASE_PLAN.md` |
| `LG40_GLOBAL_AUDIT.md` |

---

## Final verdict

# LG-4.0 AUDIT COMPLETE

No application code modified. Ready to open **LG-4.1 Integrations** when approved.
