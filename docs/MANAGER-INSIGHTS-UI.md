# Manager Insights UI

## Overview

Manager-facing intelligence is shown in the **Intelligence** tab of each project (`/dashboard/projects/[id]` → Intelligence tab).

## Panels

1. **Project Health** — Score 0–100, label (healthy/moderate/unstable/critical), blockers, missing data, delay indicators. Source: `getProjectHealth` (ai-brain).

2. **Risk Radar** — Counts high/medium/low and top risk signals. Source: `getRiskOverviewForProject` (risk-evidence-reporting use-case).

3. **Evidence Coverage** — Tasks with missing or partial photo evidence. Source: `getEvidenceCoverageForProject`.

4. **Reporting Discipline** — Late/missing report signals. Source: `getReportingDisciplineForProject`.

5. **Manager Insights** — Aggregated insights (blockers, risks, recommendations). Source: `getManagerInsights` (manager-insights use-case).

6. **Recommended Actions** — Follow-up, request evidence, review. Source: `getActionRecommendationsForProject`.

## Backend

- Single fetch: **GET /api/v1/projects/:id/intelligence** returns all of the above in one payload. No duplicate logic in UI.

## Placeholder / empty

- "No health data", "No risks", "No evidence gaps", "No reporting issues", "No recommended actions" when the corresponding arrays are empty.
- Manager insights block is rendered only when `insights.length > 0`.
