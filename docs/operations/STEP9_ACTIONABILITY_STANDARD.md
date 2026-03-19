# Step 9 — Actionability standard

## Rules

1. **next_step_hints** must come only from: `missingEvidenceInsights.recommendedAction`, `topRiskInsights.recommendedAction`, `recommendations.title`, `executiveProjectSummary.recommendedActions`.
2. No invented tasks. If lists are empty, banner may show no “Suggested next steps” section.
3. **ManagerActionView** remains the primary prioritized action list; banner hints are a second, scannable layer.

## Why bullets

Grounded in: `dataSufficiency`, `riskOverview.high`, negative health factors (names only), health `confidence`.
