# AI Brain Project Truth Snapshot — Spec

**Status:** Phase A  
**Date:** 2026-03-22

## Purpose

A typed, additive read model that assembles the minimum trustworthy context the AI Brain needs, without becoming a second domain backend. Built through existing services only.

## Type: ProjectTruthSnapshot

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| tenantId | string | Request | |
| projectId | string | Request | |
| at | string (ISO) | Assembler | Snapshot timestamp |
| projectStatus | string | project-status.service | draft, active, at_risk, blocked, completed |
| lastActivityAt | string \| null | Inferred from snapshot/reports | ISO or null |
| openTaskCounts | { total, overdue, completed, inProgress } | snapshot.mapper + project-summary | |
| reportFreshness | string | report-intelligence | "fresh" \| "stale" \| "none" \| "unknown" |
| evidenceQualitySummary | string | evidence-intelligence | Brief summary; "sufficient" \| "gaps" \| "unknown" |
| topRisksSummary | { count: number, highCount: number } | top-risks / risk-intelligence | |
| missingEvidenceSummary | { count: number } | missing-evidence | |
| intelligenceSummaryAvailability | boolean | All required services succeeded | |
| milestoneSummary | { count: number, available: boolean } | project-summary | |
| approvalPressure | { pendingCount: number, available: boolean } | project-summary.pendingDecisionsCount | |
| documentPressure | { underReviewCount: number, available: boolean } | project-summary | Same as approval |
| budgetPressure | { available: boolean, summary?: string } | cost-signals | Optional |
| dataSufficiencyFlags | DataSufficiencyFlags | Assembler | |
| snapshotWarnings | string[] | Assembler | Unavailable modules, degradation |

## DataSufficiencyFlags

```ts
interface DataSufficiencyFlags {
  snapshot: "full" | "partial" | "missing";
  health: "full" | "partial" | "missing";
  risks: "full" | "partial" | "missing";
  evidence: "full" | "partial" | "missing";
  schedule: "full" | "partial" | "missing" | "unavailable";
  approvals: "full" | "partial" | "missing" | "unavailable";
  budget: "full" | "partial" | "missing" | "unavailable";
}
```

## Rules

1. No hallucinated fields — every value comes from an existing service or explicit "unavailable"
2. No fake precision — if a domain is partial, set availability flag and summary
3. If snapshot (buildProjectSnapshot) is null → return null; no partial
4. Build through existing services only — no direct DB queries in assembler

## Assembler Location

`apps/web/lib/ai-brain/phase-a/truth-snapshot/`

- `project-truth-snapshot.types.ts` — types
- `project-truth-snapshot.assembler.ts` — assembler
- `project-truth-snapshot.assembler.test.ts` — tests
