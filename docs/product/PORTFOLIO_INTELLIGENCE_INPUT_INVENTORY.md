# Portfolio Intelligence — Input Inventory

**Date:** 2026-03-19  
**Purpose:** Multi-project signals available for Portfolio Command View.

---

## 1. Project health score

| Attribute | Value |
|-----------|--------|
| **Source** | GET /api/v1/projects/:id/intelligence → projectHealthScore (or health). |
| **Project-level availability** | Yes; per project. |
| **Portfolio aggregation readiness** | Aggregate by fetching intelligence per project (or new portfolio API); count by label (healthy/moderate/unstable/critical); distinguish low-confidence when confidence field present. |
| **Confidence** | High when data present. |
| **Gaps** | No single portfolio health API; N calls or one new aggregation endpoint. |
| **Recommended use** | Portfolio Health Overview: distribution (count/%), ranked projects; low-confidence bucket. |

---

## 2. Risk overview / top risks

| Attribute | Value |
|-----------|--------|
| **Source** | Same intelligence API → riskOverview (high/medium/low counts, signals), topRiskInsights. |
| **Project-level availability** | Yes. |
| **Portfolio aggregation readiness** | Aggregate top risks across projects (e.g. top 10 by severity); dedupe by title/pattern; link back to project. |
| **Confidence** | High. |
| **Gaps** | No portfolio risk API. |
| **Recommended use** | Portfolio Risk Radar: most severe/critical risks, project name, drilldown to project Intelligence. |

---

## 3. Executive summary availability

| Attribute | Value |
|-----------|--------|
| **Source** | intelligence → executiveProjectSummary / executiveSummary. |
| **Project-level availability** | Yes when data sufficient. |
| **Portfolio aggregation readiness** | Boolean per project (has summary); optional headline for "projects requiring attention" context. |
| **Recommended use** | Part of "requires attention" or low-confidence signal (no summary = weak data). |

---

## 4. Missing evidence / evidence coverage

| Attribute | Value |
|-----------|--------|
| **Source** | intelligence → evidenceCoverage.signals, missingEvidenceInsights. |
| **Project-level availability** | Yes. |
| **Portfolio aggregation readiness** | Count projects with evidenceGapCount > 0 or missingEvidenceCount > 0; optional total gap count. |
| **Recommended use** | Evidence/Confidence Coverage panel: projects with gaps, low confidence count. |

---

## 5. Overdue / blocked pressure

| Attribute | Value |
|-----------|--------|
| **Source** | GET /api/v1/ops/overview → tasksOverdue (list), tasks_open_today; tasks are tenant-scoped, not per-project in response. |
| **Project-level availability** | Ops overview returns task ids; task has project_id in DB but overview does not group by project. |
| **Portfolio aggregation readiness** | Partial; can show tenant-level overdue count; per-project overdue would require tasks API per project or extended ops. |
| **Gaps** | ops/overview does not return project_id for each task in the list. |
| **Recommended use** | "Projects requiring attention" can include tenant-level overdue cue; per-project overdue is a future enhancement unless task list includes project_id. |

---

## 6. Approvals / documents under review

| Attribute | Value |
|-----------|--------|
| **Source** | ops/overview → reportsPendingReview; approvals page/API. |
| **Project-level availability** | Tenant-scoped list; report has project_id in DB. |
| **Portfolio aggregation readiness** | If report/project linkage available in API, can count per project; else tenant-level only. |
| **Recommended use** | Portfolio actions or attention: "N reports pending review" with link to approvals. |

---

## 7. Budget summary / over-budget / variance

| Attribute | Value |
|-----------|--------|
| **Source** | GET /api/v1/projects/:id/costs → summary (over_budget, variance_amount, planned_total, actual_total). |
| **Project-level availability** | Yes; per project. |
| **Portfolio aggregation readiness** | N calls or one portfolio API that calls getBudgetSummary per project; list projects where over_budget or |variance| high. |
| **Recommended use** | Budget Pressure Overview: list over-budget projects, high variance; link to project Costs tab. |

---

## 8. Estimate confidence

| Attribute | Value |
|-----------|--------|
| **Source** | Project estimate APIs/panel; not in intelligence response. |
| **Project-level availability** | Per project. |
| **Portfolio aggregation readiness** | Would require N estimate calls; optional for v1. |
| **Recommended use** | Omit from first portfolio command view or add "estimate weak" count if estimate summary API exists. |

---

## 9. Existing portfolio (media/analysis-based)

| Attribute | Value |
|-----------|--------|
| **Source** | /portfolio page: listProjectsForUser, media → analysis_jobs → ai_analysis; getProjectMetrics + computePortfolio (lib/intelligence/portfolio.ts). |
| **Project-level availability** | Per-project metrics from ai_analysis (completion, risk_level, etc.). |
| **Portfolio aggregation readiness** | Already aggregated: distribution, rankedProjects, summary. Different data source (media/ai_analysis) than intelligence API (ai-brain services). |
| **Gaps** | Two parallel "portfolio" models: (a) analysis-based (current /portfolio), (b) intelligence-API-based (desired command view). |
| **Recommended use** | Either unify under one view (e.g. enhance /portfolio with intelligence + budget) or expose both: Portfolio Command View = intelligence + budget aggregation; existing Portfolio = analysis-based. |

---

## 10. Summary

- **Strongest signals for portfolio:** Project list (listByTenant or GET /api/v1/projects); per-project intelligence (health, risk, evidence, recommendations); per-project costs (over_budget, variance); ops overview (tenant-level tasks/reports).
- **Major missing:** Single portfolio aggregation API (so N calls or new endpoint); ops overview does not group tasks/reports by project_id in response.
- **Recommended approach:** New GET /api/v1/portfolio/summary (or /command) that aggregates project list + per-project intelligence + per-project budget summary server-side, returns shaped payload for six panels; limit to 15–20 projects to avoid timeouts.
