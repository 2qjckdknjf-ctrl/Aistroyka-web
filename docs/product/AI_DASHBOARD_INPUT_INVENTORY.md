# AI Dashboard — Input Inventory

**Date:** 2026-03-19  
**Purpose:** What is actually available for the manager AI dashboard / operating center.

---

## 1. Project health

| Signal | Source | Current surface | Reliability | Dashboard usefulness | Confidence | Gaps |
|--------|--------|------------------|-------------|----------------------|------------|------|
| projectHealthScore | GET /api/v1/projects/:id/intelligence → getProjectHealthScore() | Project Intelligence tab (ProjectHealthPanel) | High when data present | Score, label, factorContributions, blockers, missingData, confidence, missingDataDisclaimer | High | Per-project only; no portfolio aggregate |
| health (legacy) | Same API → getProjectHealth() | Same panel as fallback | Medium | score, label, blockers, delayIndicators | Medium | Older shape; projectHealthScore preferred |

---

## 2. Top risks

| Signal | Source | Current surface | Reliability | Dashboard usefulness | Confidence | Gaps |
|--------|--------|-----------------|-------------|----------------------|------------|------|
| topRiskInsights | GET .../intelligence → getTopRiskInsights(10) | Project Intelligence (Risk radar + Top risks ranked) | High when present | Ranked list, severity, title, explanation, recommendedAction, evidenceReferences | High | Per-project; inferred vs explicit not always distinguished in UI |
| riskOverview | Same API → getRiskOverviewForProject() | riskOverview.high/medium/low counts + riskOverview.signals | High | Counts + signal list for radar view | High | signals may be empty if only insights exist |

---

## 3. AI insights / executive summary

| Signal | Source | Current surface | Reliability | Dashboard usefulness | Confidence | Gaps |
|--------|--------|-----------------|-------------|----------------------|------------|------|
| executiveProjectSummary | getExecutiveProjectSummary() | SummaryCard on Project Intelligence | High when data sufficient | headline, summary, topRisks, recommendedActions, dataSufficiency, missingDataDisclaimer | High | Per-project |
| executiveSummary | getExecutiveSummaryForProject() | Fallback SummaryCard | Medium | Same shape | Medium | Legacy |
| insights | getManagerInsights() | Manager insights card | Medium | risk/delay/missing_evidence/blocker/recommendation | Medium | Count can be 0 |
| recommendations | getActionRecommendationsForProject() | RecommendationList | High | title, description, priority, relatedResourceType/Id | High | Per-project |

---

## 4. Evidence coverage

| Signal | Source | Current surface | Reliability | Dashboard usefulness | Confidence | Gaps |
|--------|--------|-----------------|-------------|----------------------|------------|------|
| evidenceCoverage | getEvidenceCoverageForProject() | EvidenceCoverageCard (signals[]) | High | signals: taskId, type, severity, required/actual, message | High | Per-project; no explicit "stale evidence" field in type (can be in message) |
| missingEvidenceInsights | getMissingEvidenceInsights() | Missing evidence card | High | title, explanation, recommendedAction, evidenceReferences | High | Per-project |

---

## 5. Budget / cost / estimate

| Signal | Source | Current surface | Reliability | Dashboard usefulness | Confidence | Gaps |
|--------|--------|-----------------|-------------|----------------------|------------|------|
| costs + budget summary | GET /api/v1/projects/:id/costs | ProjectCostsPanel on project detail | High | planned/actual, variance; list of cost items | High | Not in intelligence API; separate route; per-project |
| estimate | Project estimate APIs/panel | ProjectEstimatePanel | Medium | Estimate results from image/inputs | Medium | Newer; confidence/weak state documented elsewhere |

---

## 6. Pending approvals / documents

| Signal | Source | Current surface | Reliability | Dashboard usefulness | Confidence | Gaps |
|--------|--------|-----------------|-------------|----------------------|------------|------|
| reportsPendingReview | GET /api/v1/ops/overview → queues.reportsPendingReview | Dashboard Ops + Priority actions | High | Report IDs; link to /dashboard/reports/:id | High | Tenant-scoped; not per-project in overview |
| approvals | Dashboard Approvals page / API | DashboardApprovalsClient | High | Document/report approvals | High | Separate flow |

---

## 7. Tasks

| Signal | Source | Current surface | Reliability | Dashboard usefulness | Confidence | Gaps |
|--------|--------|-----------------|-------------|----------------------|------------|------|
| tasksOverdue | ops/overview → queues.tasksOverdue | Ops overview + Priority actions | High | id, title, due_date; link to task | High | Tenant-scoped |
| tasksOpenToday | ops/overview → queues.tasksOpenToday | Same | High | Same | High | Tenant-scoped |
| tasks_assigned_today, tasks_completed_today, tasks_overdue (KPIs) | ops/overview → kpis | DashboardOpsOverviewClient | High | Counts | High | Tenant-scoped |

---

## 8. Team / workers / reports

| Signal | Source | Current surface | Reliability | Dashboard usefulness | Confidence | Gaps |
|--------|--------|-----------------|-------------|----------------------|------------|------|
| activeWorkersToday | ops/overview → kpis | Ops KPI card | High | Count | High | — |
| reportsToday | ops/overview → kpis | Ops KPI card | High | Count | High | — |
| workersOpenShiftNoReportToday | ops/overview → queues | Ops + Priority actions | High | user_id, day_date; link to worker | High | — |
| workersOpenShift | ops/overview → queues | Ops overview | High | Same | High | — |

---

## 9. Alerts / operational

| Signal | Source | Current surface | Reliability | Dashboard usefulness | Confidence | Gaps |
|--------|--------|-----------------|-------------|----------------------|------------|------|
| alerts | GET /api/v1/alerts | DashboardIntelligenceSectionClient (AlertFeed) | High | id, severity, type, message, created_at, resolved_at | High | Tenant-scoped |
| operational | buildManagerOperationalContext() in intelligence API | IntelligenceOperationalBanner, ManagerActionView | High | state, trust_band, disclaimers, next_step_hints | High | Per-project; in intelligence response |

---

## 10. Portfolio-level AI (dashboard-wide)

| Signal | Source | Current surface | Reliability | Dashboard usefulness | Confidence | Gaps |
|--------|--------|-----------------|-------------|----------------------|------------|------|
| useAIState() | ai_state_cache + ai_events | DashboardAIInsightsClient (AISignalLine) | Medium | idle | analyzing | risk_detected | etc. | Medium | Portfolio; may be sparse |
| useProjectRisk(null) | Portfolio risk | total_score, trend | Medium | Single score + trend arrow | Medium | Portfolio aggregate; not per-project |

---

## 11. Summary

- **Strongest signals for dashboard panels:** projectHealthScore, topRiskInsights, riskOverview, executiveProjectSummary, evidenceCoverage, missingEvidenceInsights, recommendations (all from GET .../intelligence per project); ops overview (tasks, reports, workers, uploads, AI failed) for team/productivity and “what needs attention.”
- **Major missing inputs:** No single “portfolio health” or “portfolio risk” aggregate API; no dashboard-level “all projects’ health” without N fetches. Cost/budget not in intelligence response (separate costs API). Stale evidence is not a dedicated field (can be in evidence message or reporting discipline).
- **Per-project vs tenant:** Intelligence and health/risk/evidence are per-project. Ops overview and alerts are tenant-scoped. Dashboard can show one “focus project” intelligence + tenant-wide ops.
