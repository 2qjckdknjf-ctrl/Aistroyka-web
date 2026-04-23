# Portfolio Intelligence — Information Model

**Date:** 2026-03-19  
**Purpose:** Structure of Portfolio Command View (six panels + integration).

---

## 1. Portfolio Health Overview

| Attribute | Value |
|-----------|--------|
| **Purpose** | One-glance distribution of project health; separate healthy vs unhealthy vs low-confidence. |
| **Signals used** | projectHealthScore/health per project: score, label (healthy/moderate/unstable/critical), confidence. |
| **Confidence/degraded** | Show count of low-confidence or no-data projects; no fake precision. |
| **Drilldown** | Link to project Intelligence tab. |
| **Empty state** | No projects: "Create projects to see portfolio health." No health data: "Health data not yet available for these projects." |

---

## 2. Projects Requiring Attention

| Attribute | Value |
|-----------|--------|
| **Purpose** | Ranked list of projects that need manager action. |
| **Signals used** | Severe top risks, missing evidence count, health label critical/unstable, over_budget, variance pressure, low confidence. |
| **Confidence/degraded** | Reason text per row (e.g. "Critical health", "Over budget", "3 evidence gaps"). |
| **Drilldown** | Each row links to project Intelligence (or Costs/Documents as appropriate). |
| **Empty state** | "No projects requiring immediate attention." |

---

## 3. Portfolio Risk Radar

| Attribute | Value |
|-----------|--------|
| **Purpose** | Highest-severity risks across portfolio with project context. |
| **Signals used** | topRiskInsights and riskOverview.signals per project; aggregate top N by severity. |
| **Confidence/degraded** | Show missingDataDisclaimer when present; no false precision. |
| **Drilldown** | Link to project Intelligence; optional "Open related" from evidenceReferences. |
| **Empty state** | "No risks flagged across portfolio." |

---

## 4. Evidence / Confidence Coverage

| Attribute | Value |
|-----------|--------|
| **Purpose** | How many projects have evidence gaps or low confidence. |
| **Signals used** | evidenceCoverage.signals length, missingEvidenceInsights length, projectHealthScore.confidence, executiveProjectSummary.dataSufficiency. |
| **Confidence/degraded** | Counts; list project names with gaps or low confidence. |
| **Drilldown** | Link to project Intelligence. |
| **Empty state** | "No evidence gaps or low-confidence projects." |

---

## 5. Budget Pressure Overview

| Attribute | Value |
|-----------|--------|
| **Purpose** | Projects over budget or with high variance. |
| **Signals used** | GET .../costs summary per project: over_budget, variance_amount. |
| **Confidence/degraded** | Only show when data exists; "No budget data" vs "No over-budget projects." |
| **Drilldown** | Link to project Costs tab. |
| **Empty state** | "No budget pressure" or "Budget data not configured for these projects." |

---

## 6. Recommended Portfolio Actions

| Attribute | Value |
|-----------|--------|
| **Purpose** | Top actions across portfolio; no duplicate/conflicting CTAs. |
| **Signals used** | getActionRecommendationsForProject per project; dedupe by type/title; limit to top 5–7. |
| **Confidence/degraded** | Priority from recommendation; link to relatedResourceType/Id. |
| **Drilldown** | Use getResourceHref for task/report/project. |
| **Empty state** | "No recommended actions." |

---

## 7. Integration

- Single Portfolio Command View surface (e.g. /dashboard/portfolio or enhanced /portfolio).
- Consistent cards; obvious drilldowns to project Intelligence, Costs, tasks, reports.
- Strong empty/degraded states; low cognitive load.
