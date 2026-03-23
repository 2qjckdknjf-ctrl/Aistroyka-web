# Phase 4 — Construction intelligence inventory

**Date:** 2026-03-23  
**Tracks:** [AISAA-12](/AISAA/issues/AISAA-12); depends on production truth from [AISAA-11](/AISAA/issues/AISAA-11).

## Executive summary

The web app exposes a **layered intelligence stack**: (1) **deterministic read models** (project summary, attention, timeline) backed by tenant-scoped Supabase tables and explicit access checks; (2) **portfolio aggregation** (`/api/v1/portfolio/summary`) that composes `lib/ai-brain` heuristics, cost summaries, and project listing; (3) **plan / entitlement surfacing** under `/api/v1/plan-fit/*`; (4) **adjacent product intelligence** (e.g. image estimate, onboarding plan-fit UI). Prior product deep-dives live under `docs/product/PORTFOLIO_INTELLIGENCE_*.md` and remain the information-model reference; this file is the **engineering route + data-source map**.

## Project-scoped APIs (manager + owner)

| Route | Purpose | Domain / service | Primary tables / sources | Access |
|-------|---------|------------------|---------------------------|--------|
| `GET /api/v1/projects/:id/summary` | Counts + derived `projectStatus`, `healthLevel`, `statusReasons`, `attentionItems` | `project.service` + `project-summary.repository` + `project-status.service` | Tasks, reports, milestones, issues, documents (aggregates) | Tenant + project membership via `getProject` |
| `GET /api/v1/projects/:id/attention?viewer=manager\|owner` | Action queue: pending decisions, changes requested, open issues | `project-attention.repository` | `project_documents`, `project_issues` | `requireProjectAccess` (manager) or `requireProjectOwner` (owner) |
| `GET /api/v1/projects/:id/timeline?limit=` | Unified activity feed | `project-timeline.repository` | Mixed project-scoped entities (tasks, reports, media, milestones, documents, issues — see repository) | Via `getProject` |
| `GET /api/v1/projects/:id/issues` | Issues list (panel + attention context) | Issues domain | `project_issues` | Project access |
| `GET /api/v1/projects/:id/estimate/from-image` | Vision-backed estimate (intelligence-adjacent) | Estimate pipeline | Storage + AI | Project access |

## Portfolio

| Route | Purpose | Composition |
|-------|---------|-------------|
| `GET /api/v1/portfolio/summary` | Command view: per-project health, risks, evidence gaps, budget pressure, recommendations | `listByTenant` → for each project (max 15): `getProjectHealthScore`, `getRiskOverviewForProject`, `getEvidenceCoverageForProject`, `getMissingEvidenceInsights`, `getTopRiskInsights`, `getActionRecommendationsForProject`, `getBudgetSummary` |

**RLS / sensitivity:** All handlers use `createClientFromRequest` and `getTenantContextFromRequest`; data reads are tenant-bound. Portfolio never leaks cross-tenant data if RLS and `listByTenant` are correct. **Operational note:** anon health and tenant RLS recursion were a P0 concern; see [PHASE3_REMEDIATION.md](./PHASE3_REMEDIATION.md).

## Plan fit / capabilities (tenant-level “intelligence”)

| Route | Role |
|-------|------|
| `GET /api/v1/plan-fit/surface` | Plan surface view model for UI |
| `GET /api/v1/plan-fit/current` | Current plan context |
| `GET /api/v1/plan-fit/orchestration` | Orchestration state |
| `GET/POST …/recommend`, `…/recommend/latest` | Recommendations |
| `POST …/select` | Selection / persistence |

Implementation is under `lib/platform/plan-fit/` and related migrations (plan fit persistence, billing readiness).

## Ops / diagnostics (supporting truth)

| Route | Role |
|-------|------|
| `GET /api/v1/ops/overview` | Operational overview (admin-style diagnostics surface) |

Not executive “construction intelligence” but relevant for **truthful runtime** claims.

## Dashboard UX entry points

| Surface | Client / component | APIs consumed |
|---------|-------------------|---------------|
| Project detail (manager) | `DashboardProjectDetailClient.tsx` | `summary`, `attention?viewer=manager`, `timeline`, `issues`, … |
| Owner view | `OwnerViewClient.tsx` | `summary`, `attention?viewer=owner`, `timeline` (smaller limits) |
| Portfolio command | `PortfolioCommandViewClient.tsx` | `GET /api/v1/portfolio/summary` |
| Drill-down links | `lib/intelligence/resource-links.ts` (`getResourceHref`) | Used by portfolio / intelligence cards |

## Explainability

- **Deterministic layer:** `project-status.service` exposes `statusReasons` and `attentionItems` with stable codes; attention repository returns typed sections and severities.
- **Heuristic / AI-brain layer:** Portfolio and health use `lib/ai-brain` services; responses include labels, scores, and short titles but are **not** a single formal “insight contract” document in code — product specs in `docs/product/` describe the intended model.

## Master backlog crosswalk (`PHASE0_MASTER_BACKLOG.md`)

| Backlog ID | Theme | Relation to this layer |
|------------|-------|-------------------------|
| P1-06 | Notifications | Separate API/UI; complements attention but not the same read model |
| P2-01 | Manager control center | Partially satisfied by project summary + attention + timeline + panels |
| P2-03 | Construction intelligence (contracts, explainability) | **Partially** — APIs exist; formal cross-cutting “insight contract” and exhaustive UI explainability not fully closed here |
| P2-06 | Portfolio / portfolio API | **Implemented** — `/api/v1/portfolio/summary` + dashboard page |
| P2-04 / P2-05 | Workflow map / copy consistency | Out of scope for Phase 4 closure docs; still OPEN at product level |
