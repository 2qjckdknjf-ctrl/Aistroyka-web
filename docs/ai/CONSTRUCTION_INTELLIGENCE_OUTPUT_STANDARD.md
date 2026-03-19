# Construction Intelligence — Output Standard

**Date:** 2026-03-19  
**Scope:** Contract/schema for manager-facing intelligence outputs. All outputs distinguish fact-based vs inferred vs low-confidence vs unavailable.

---

## 1. MissingEvidenceInsight

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique id (e.g. me-{ts}-{rand}) |
| projectId | string | Project id |
| type | "task" \| "report" \| "before_after" \| "stale" | Kind of gap |
| severity | low \| medium \| high | Signal severity |
| title | string | Short title |
| explanation | string | Why evidence is missing/weak |
| evidenceReferences | EvidenceReference[] | task, worker_day, etc. |
| confidence | high \| medium \| low \| heuristic | high when required/actual known |
| contributingFactors | string[] | e.g. "Required: N", "Actual: M" |
| recommendedAction | string | What manager should do |
| missingDataDisclaimer | string? | When data is partial |
| at | string | ISO timestamp |

**Fact vs inferred:** task/report counts and before/after counts are fact-based; stale is heuristic (activity window). Low confidence when required/actual unknown.

---

## 2. TopRiskInsight

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique id |
| projectId | string | Project id |
| rank | number | 1-based rank |
| severity | low \| medium \| high | From RiskSignal |
| title | string | Risk title |
| description | string | Detail |
| source | "explicit" \| "inferred" | explicit = manual/DB; inferred = from tasks/reports/evidence |
| explanation | string | Why this is a risk |
| evidenceReferences | EvidenceReference[] | task, etc. |
| confidence | high \| medium \| low \| heuristic | high when resourceId/resourceType present |
| contributingFactors | string[] | e.g. "Task past due date" |
| recommendedAction | string | Next step |
| missingDataDisclaimer | string? | Optional |
| at | string | ISO timestamp |

**Fact vs inferred:** overdue/blocked from DB are fact-based; blocked and schedule_pressure are inferred.

---

## 3. ExecutiveProjectSummary

| Field | Type | Description |
|-------|------|-------------|
| projectId, tenantId, at | string | Identity and time |
| headline | string | e.g. "Project health: moderate" |
| summary | string | Short narrative (blockers + risks) |
| healthLabel | healthy \| moderate \| unstable \| critical | From health |
| healthScore | number | 0–100 |
| recentProgress | string[] | e.g. "N report(s) submitted in last 7 days" |
| atRisk | string[] | Top risk titles/descriptions |
| missingEvidence | string[] | Evidence gap messages |
| requiresAttention | string[] | Blockers, missing data, high risks |
| topRisks | string[] | Risk titles |
| recommendedActions | string[] | From health + risks |
| metrics | { label, value }[] | Health, score, workers, overdue, etc. |
| dataSufficiency | sufficient \| partial \| insufficient | sufficient = workers + tasks; insufficient = neither |
| missingDataDisclaimer | string? | Set when partial/insufficient |

**Unavailable/missing:** When dataSufficiency is insufficient or partial, summary explicitly avoids hallucination; missingDataDisclaimer explains limits.

---

## 4. ProjectHealthScore

| Field | Type | Description |
|-------|------|-------------|
| projectId, tenantId, at | string | Identity and time |
| score | number | 0–100 |
| label | healthy \| moderate \| unstable \| critical | From score bands |
| factorContributions | { factor, impact, explanation }[] | Transparent breakdown (overdue, no reports, combo) |
| blockers | string[] | e.g. "N overdue task(s)" |
| missingData | string[] | e.g. "No recent reports" |
| delayIndicators | string[] | e.g. "Overdue tasks" |
| confidence | high \| medium \| low | Degrades when no workers/tasks |
| missingDataDisclaimer | string? | When minimal data |

**Fact-based:** Score is computed from snapshot counts and fixed penalties (see CONSTRUCTION_INTELLIGENCE_HEALTH_MODEL.md). No black-box.
