# Report: Intelligence UI Layer (ETAP 10–20)

## 1. Where intelligence panels are embedded

| Location | Content |
|----------|---------|
| **Dashboard home** (`/dashboard`) | Section "Intelligence & Alerts": CTA card (link to projects) + AlertFeed (last 10 tenant alerts). |
| **Project detail** (`/dashboard/projects/[id]`) | Tab **Intelligence**: ProjectHealthPanel, Executive SummaryCard, Risk Radar (counts + RiskList), EvidenceCoverageCard, ReportingDisciplineCard, Manager insights list, RecommendationList, CopilotSummaryPanel. |
| **Alerts** (`/dashboard/alerts`) | Full AlertFeed (up to 50 tenant alerts). Linked from sidebar as "Alerts". |

## 2. Backend services / use-cases used

- **GET /api/v1/projects/[id]/intelligence** — Aggregates: `getProjectHealth`, `getManagerInsights`, `getRiskOverviewForProject`, `getEvidenceCoverageForProject`, `getReportingDisciplineForProject`, `getExecutiveSummaryForProject`, `getActionRecommendationsForProject` (ai-brain and risk-evidence-reporting use-cases).
- **GET /api/v1/projects/[id]/copilot?useCase=...** — Copilot briefs: `generateManagerBrief`, `generateExecutiveBrief`, `detectTopRisks`, `findMissingEvidence`, `identifyBlockedTasks`, `summarizeProjectStatus`, `summarizeDailyReports`.
- **GET /api/v1/alerts** — Tenant-scoped alerts via `listAlerts` (lib/sre/alert.service).

## 3. New reusable UI components

All under `apps/web/components/intelligence/`:

- **IntelligenceCard** — Card wrapper with title.
- **SeverityBadge** — low/medium/high.
- **ProjectHealthPanel** — Health score, label, blockers, missingData, delayIndicators.
- **SummaryCard** — Executive summary (headline, summary, topRisks, recommendedActions).
- **RiskList** — Risk signals with severity.
- **EvidenceCoverageCard** — Evidence gaps (required/actual).
- **ReportingDisciplineCard** — Report signals.
- **RecommendationList** — Action recommendations.
- **AlertFeed** — Alerts list with severity and created_at.
- **CopilotSummaryPanel** — Use-case selector + brief text.

Types: `components/intelligence/types.ts` (ProjectIntelligenceData, ProjectHealthData, ManagerInsightData, RiskSignalData, AlertItemData, etc.).

## 4. Pages / sections changed

- **Dashboard home** — New `DashboardIntelligenceSectionClient` section.
- **Project detail** — New "Intelligence" tab in `DashboardProjectDetailClient`; new `ProjectIntelligenceClient` page component.
- **Alerts** — New route `/dashboard/alerts` with `DashboardAlertsClient`.
- **Sidebar** — New nav item "Alerts" → `/dashboard/alerts` and `nav.alerts` in en/ru/es/it.

## 5. Empty / loading / error states

- **ProjectIntelligenceClient**: Skeleton while loading; ErrorState with retry on API error; per-card empty copy ("No health data", "No risks", "No evidence gaps", etc.).
- **DashboardIntelligenceSectionClient**: Loading for alerts; error state with retry; CTA when no project context.
- **CopilotSummaryPanel**: Skeleton; ErrorState + retry; "No brief content" when response empty.
- **AlertFeed**: "No alerts" when list empty.

## 6. What works vs partial

- **Works:** Single intelligence API per project; all panels consume it; Copilot briefs by useCase; tenant alerts on home and /dashboard/alerts; sidebar link; build/typecheck/lint pass.
- **Partial:** Portfolio/aggregate executive view not implemented (dashboard home = CTA + alerts). Role-based visibility not gated (TODO/extension point). Alerts have no filter by source or resolve/dismiss in UI.

## 7. Build / typecheck / lint

- **Build:** `npm run build` (apps/web) — success.
- **Typecheck:** No type errors.
- **Lint:** No reported lint errors.

## 8. Risks and TODOs

- **Role awareness:** Manager vs executive blocks are not role-gated; add when permissions model is ready.
- **Portfolio:** Add portfolio risk snapshot when multi-project/portfolio API exists.
- **Alerts:** Optional filters (source, unresolved) and resolve/dismiss actions for future iteration.

## 9. Recommended next steps

1. Add role/permission checks and show manager vs executive blocks accordingly.
2. Implement portfolio-level intelligence API and dashboard home executive snapshot.
3. Add alerts filters and resolve/dismiss if product requires.
4. Optional: mobile/tablet pass for Intelligence tab and Alerts page.
