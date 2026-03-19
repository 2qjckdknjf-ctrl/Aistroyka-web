# AI Dashboard — Information Model

**Date:** 2026-03-19  
**Purpose:** Minimal, strong structure for the manager AI operating center (five panels + integration).

---

## 1. Panel: Project Health

| Attribute | Value |
|-----------|--------|
| **Purpose** | One-glance project health score and contributing factors. |
| **Primary metrics/signals** | projectHealthScore (or health): score, label, factorContributions, blockers, missingData, delayIndicators, confidence, missingDataDisclaimer. |
| **Confidence / missing-data** | Show confidence and missingDataDisclaimer when present; empty state when no health data. |
| **Drill-down** | Link to project Intelligence tab: `/dashboard/projects/:id` (Intelligence section). |
| **When to show empty/degraded** | No focus project selected; or intelligence fetch failed; or health/projectHealthScore null. Show "Select a project" or "Health not available" and CTA to project. |

---

## 2. Panel: Risk Radar

| Attribute | Value |
|-----------|--------|
| **Purpose** | Ranked top risks and severity cues; no false precision. |
| **Primary metrics/signals** | topRiskInsights (rank, severity, title, explanation, recommendedAction), riskOverview (high/medium/low counts, signals). |
| **Confidence / missing-data** | Show missingDataDisclaimer on insights when present; infer "weak data" when counts zero and no insights. |
| **Drill-down** | Link to project Intelligence; link "Open related" from evidenceReferences when present. |
| **When to show empty/degraded** | No project or no risk data: "No risks flagged" or "Select a project to see risks." |

---

## 3. Panel: AI Insights

| Attribute | Value |
|-----------|--------|
| **Purpose** | Executive summary excerpt, key insights, missing evidence cues, recommended next steps. |
| **Primary metrics/signals** | executiveProjectSummary (headline, summary, topRisks, recommendedActions, dataSufficiency); missingEvidenceInsights (title, recommendedAction); recommendations (title, priority). |
| **Confidence / missing-data** | dataSufficiency, missingDataDisclaimer; show when not sufficient. |
| **Drill-down** | Link to full project Intelligence tab; links from recommendations (relatedResourceType/Id). |
| **When to show empty/degraded** | No summary: "No summary yet — add tasks and reports" with link to project. |

---

## 4. Panel: Evidence Coverage

| Attribute | Value |
|-----------|--------|
| **Purpose** | Evidence strength and gaps; stale cues if present in signals/message. |
| **Primary metrics/signals** | evidenceCoverage.signals (taskId, type, severity, required/actual, message); missingEvidenceInsights. |
| **Confidence / missing-data** | Empty list = no gaps (good); show "No evidence gaps" when signals.length === 0. |
| **Drill-down** | Link to task (taskId) and to project Intelligence / documents. |
| **When to show empty/degraded** | No project: "Select a project"; no signals: "No evidence gaps flagged." |

---

## 5. Panel: Team Productivity

| Attribute | Value |
|-----------|--------|
| **Purpose** | Grounded in real ops data: tasks, reports, workers (no invented score). |
| **Primary metrics/signals** | From GET /api/v1/ops/overview: kpis (tasks_assigned_today, tasks_completed_today, tasks_open_today, tasks_overdue, reportsToday, activeWorkersToday); queues (tasksOverdue, tasksOpenToday, reportsPendingReview, workersOpenShiftNoReportToday). |
| **Confidence / missing-data** | Tenant-scoped; show counts and short list with links; no pseudo-productivity score. |
| **Drill-down** | /dashboard/tasks, /dashboard/reports/:id, /dashboard/workers/:id, /dashboard/approvals. |
| **When to show empty/degraded** | Ops overview failed: show error/retry; data empty: "No open tasks or pending reports today." |

---

## 6. Integration

- **Focus project:** Dashboard operating center uses one "focus" project for Health, Risk, AI Insights, Evidence. Team Productivity is tenant-wide (ops overview).
- **Layout:** Coherent grid of cards; consistent CTAs ("Open project", "View Intelligence", "Open task").
- **No dead ends:** Every panel has at least one link to project, intelligence, task, or report.
