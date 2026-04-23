# Portfolio Intelligence — State Model

**Date:** 2026-03-19  
**Purpose:** Normalize portfolio-level UI states for the Command View.

---

## 1. States (normalized)

| State | Meaning | Panel behavior |
|-------|---------|----------------|
| **no projects / no data** | Tenant has no projects or summary API failed. | Show "Create projects" or error/retry; no panels with fake data. |
| **weak portfolio coverage** | Few projects; or many with no health data (noData count high). | Show distribution with noData; avoid implying full coverage. |
| **low-confidence portfolio view** | Many projects with low confidence or missingDataDisclaimer. | Show lowConfidence count; do not overstate health. |
| **healthy portfolio** | Most projects healthy; no critical; no budget pressure. | Green-leaning distribution; "No projects requiring attention." |
| **portfolio under pressure** | One or more critical/unstable; or high risks. | Show attention list; risk radar; clear drilldown. |
| **budget pressure** | One or more over_budget or high variance. | Budget pressure panel list; link to project Costs. |
| **evidence pressure** | Projects with evidence gaps or missing evidence. | Evidence/confidence panel; count and project list. |
| **mixed-confidence portfolio** | Some healthy, some no data, some low confidence. | Distribution shows all buckets; no fake precision. |

---

## 2. Panel-specific handling

- **Portfolio Health:** No projects → empty state. distribution.noData / lowConfidence → show explicitly. No invented percentages.
- **Projects Requiring Attention:** Empty when requiresAttentionReasons.length === 0 for all. Reasons are from real signals (critical health, over budget, evidence gaps, etc.).
- **Portfolio Risk Radar:** Empty when portfolioRisks.length === 0. Risks from topRiskInsights/riskOverview only.
- **Evidence/Confidence Coverage:** Empty when no evidence gaps and lowConfidenceCount === 0. Otherwise counts and project links.
- **Budget Pressure:** Empty when no over_budget and no significant variance. Otherwise list with project link.
- **Recommended Actions:** Empty when no recommendations. Actions from getActionRecommendationsForProject; drilldown via getResourceHref.

---

## 3. No dead ends

Every panel has at least one link: to /dashboard/projects, or to /dashboard/projects/:id?tab=intelligence, or to /dashboard/projects/:id?tab=costs, or to task/report via getResourceHref.
