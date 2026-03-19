# Construction Intelligence — Explainability

**Date:** 2026-03-19  
**Principle:** No black-box. Every output has confidence, explanation, contributing factors, and missing-data handling where relevant.

---

## 1. Confidence levels

- **high:** Inputs are fact-based and complete (e.g. required/actual counts, resourceId/resourceType, overdue from DB).
- **medium:** Inferred or partial (e.g. blocked inferred from overdue + in progress + no report; staleness window).
- **low:** Sparse or heuristic-only.
- **heuristic:** Explicitly marked when rule-of-thumb (e.g. schedule pressure from overdue concentration).

Used in: MissingEvidenceInsight.confidence, TopRiskInsight.confidence, ProjectHealthScore.confidence.

---

## 2. Why this insight exists

- **Missing evidence:** explanation = why evidence is missing (e.g. "Task requires N photo(s); M provided. Gap: K." or "No evidence in last 14 days while project has recent activity"). contributingFactors list required/actual or thresholds.
- **Top risk:** explanation = title + contributing factors (e.g. "Overdue task. Task past due date."). source = explicit vs inferred.
- **Executive summary:** headline and summary are built from health.label and blockers/risks; recentProgress/atRisk/missingEvidence are lists of real signals.
- **Health score:** factorContributions list each factor, impact (negative points), and explanation (e.g. "3 overdue task(s) × 5 each, cap 25").

---

## 3. Which inputs contributed

- **evidenceReferences:** Links to task, worker_day, etc., so the manager can open the related resource.
- **contributingFactors:** Text list (e.g. "Required: 2", "Actual: 0", "Evidence older than 14 days").
- **factorContributions (health):** factor name, impact, explanation.

---

## 4. What data was missing

- **missingDataDisclaimer** on MissingEvidenceInsight, TopRiskInsight, ExecutiveProjectSummary, ProjectHealthScore when data is partial or insufficient.
- **dataSufficiency** on ExecutiveProjectSummary: sufficient | partial | insufficient (drives disclaimer).
- **missingData** on ProjectHealthScore: e.g. "No recent reports".
- **Executive summary:** "No recent activity signals" / "No risk signals in view" / "No evidence gaps detected" when lists are empty.

---

## 5. Recommended next action

- **MissingEvidenceInsight.recommendedAction:** e.g. "Request additional photo evidence for this task.", "Request fresh photo evidence for recent project activity."
- **TopRiskInsight.recommendedAction:** Per source (overdue → "Review and reschedule or complete overdue task."; blocked → "Unblock: request report or reassign task."; etc.).
- **ExecutiveProjectSummary.recommendedActions:** From health blockers/missing data and high risks.
- **ManagerActionView:** Aggregates missing evidence + top risks + recommendations + executive recommended actions into a single "what to do next" list with links.

---

## 6. No black-box

- Health score: formula and constants documented in CONSTRUCTION_INTELLIGENCE_HEALTH_MODEL.md and implemented in project-health-v2.service.
- Risks: sourced from risk-intelligence (task, report, evidence, milestone, cost signals); source and contributingFactors explain each risk.
- Missing evidence: from evidence-intelligence and evidence-staleness; type and explanation explain each gap.
- Executive summary: assembled from health, risks, snapshot, report and evidence signals; no free-form LLM narrative in the main path (v2 is deterministic).
