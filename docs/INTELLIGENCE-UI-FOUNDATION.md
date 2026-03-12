# Intelligence UI Foundation

## Overview

The Intelligence UI layer surfaces AI brain, copilot, and alert data inside the dashboard. All data comes from existing backend services and use-cases; the UI does not duplicate business logic.

## Where panels are placed

- **Dashboard home** (`/dashboard`): Section "Intelligence & Alerts" with CTA to project Intelligence tab and tenant-scoped AlertFeed.
- **Project detail** (`/dashboard/projects/[id]`): New tab **Intelligence** with Project Health, Executive Summary, Risk Radar, Evidence Coverage, Reporting Discipline, Manager Insights, Recommended Actions, and Copilot brief.
- **Alerts** (`/dashboard/alerts`): Dedicated page with full AlertFeed (tenant-scoped).

## Backend used

- **GET /api/v1/projects/[id]/intelligence** — Aggregated health, insights, riskOverview, evidenceCoverage, reportingDiscipline, executiveSummary, recommendations (from ai-brain use-cases and services).
- **GET /api/v1/projects/[id]/copilot?useCase=...** — Copilot brief (generateManagerBrief, detectTopRisks, etc.).
- **GET /api/v1/alerts** — Tenant-scoped alerts (from lib/sre/alert.service listAlerts).

## Reusable components (`components/intelligence`)

- **IntelligenceCard** — Wrapper with title.
- **SeverityBadge** — low/medium/high badge.
- **ProjectHealthPanel** — Score, label, blockers, missingData, delayIndicators.
- **SummaryCard** — Executive summary (headline, summary, topRisks, recommendedActions).
- **RiskList** — List of risk signals with severity.
- **EvidenceCoverageCard** — Evidence gaps (required/actual, message).
- **ReportingDisciplineCard** — Report signals (missing, late, etc.).
- **RecommendationList** — Action recommendations.
- **AlertFeed** — List of alerts with severity and timestamp.
- **CopilotSummaryPanel** — Use-case selector and brief text (from Copilot API).

## Loading / empty / error

- **ProjectIntelligenceClient**: Loading skeleton, ErrorState with retry, empty states via "No …" messages in each card.
- **DashboardIntelligenceSectionClient**: Same for alerts; CTA card when no project selected.
- **CopilotSummaryPanel**: Skeleton while loading, ErrorState with retry, "No brief content" when empty.

## What is real vs partial

- **Real:** All panels read from the new APIs; APIs call existing ai-brain use-cases and copilot/alert services. Sidebar link to Alerts; Intelligence tab on project detail.
- **Partial:** Portfolio-level executive view is not implemented (dashboard home shows CTA to open a project). Role-based visibility is not gated (extension point / TODO).
