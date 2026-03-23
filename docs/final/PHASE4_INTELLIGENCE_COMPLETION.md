# Phase 4 — Construction intelligence completion

**Date:** 2026-03-23  
**Issue:** [AISAA-12](/AISAA/issues/AISAA-12)

## What “done” means for this phase (closure scope)

Phase 4 asked for **explainable construction intelligence** in a **truthful** product state. This document records **what is implemented in the repo** versus what remains **OPEN** at the product or operations level.

## Completed in repo (engineering)

1. **Project intelligence read APIs:** `summary`, `attention` (manager/owner), `timeline` — wired to dashboard and owner surfaces.
2. **Derived status and health:** `project-status.service` integrated into `summary` response (`projectStatus`, `healthLevel`, `statusReasons`, `attentionItems`).
3. **Portfolio command API + UI:** `GET /api/v1/portfolio/summary` and `PortfolioCommandViewClient` with distribution, budget pressure, cross-project risks, and recommended actions.
4. **Supporting domain tests:** `project-attention.repository.test.ts`, `project-timeline.repository.test.ts`, `project-status.service.test.ts`, `portfolio-summary-shape.test.ts`.
5. **Plan-fit platform routes** for capability / upgrade intelligence (`/api/v1/plan-fit/*`).
6. **Prior product documentation** for portfolio information model (`docs/product/PORTFOLIO_INTELLIGENCE_*.md`) — not re-authored here; still valid as the conceptual layer.

## Intentionally not closed in this ticket (remains OPEN)

| Item | Why OPEN |
|------|-----------|
| **P0 production DB parity + health** ([AISAA-11](/AISAA/issues/AISAA-11)) | Intelligence routes depend on authenticated Supabase + RLS; prod **503 health** and migration lag break “runtime truth” until ops applies remedial migrations. |
| **Formal insight contract (P2-03)** | No single versioned schema documents every `ai-brain` signal end-to-end; portfolio combines multiple services with heuristic `reasons` strings. |
| **Executive narrative / golden-path copy** | Manager UX has blocks and badges; a full “executive summary story” across portfolio + project is product polish (P2-05 adjacent). |
| **Notifications as intelligence** (P1-06) | Separate subsystem; may surface the same facts but not merged into one read model in this pass. |
| **Unified workflow entity map** (P2-04) | Documentation / architecture backlog item. |

## Backlog items touched but not erased

- **P2-01 Manager control center:** Core ingredients shipped; “single pane” completeness is subjective — see validation doc for gaps.
- **P2-06 Portfolio API:** Shipped for the command view shape; pagination beyond first 15 projects and full tenant scale are future hardening.

## Verdict precursor

Repo contains a **credible intelligence layer** for Phase 4. **Production truth** is **not** claimed closed while [AISAA-11](/AISAA/issues/AISAA-11) is outstanding — see [PHASE4_INTELLIGENCE_POST_AUDIT.md](./PHASE4_INTELLIGENCE_POST_AUDIT.md).
