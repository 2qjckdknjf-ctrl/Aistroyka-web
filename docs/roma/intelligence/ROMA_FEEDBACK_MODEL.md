# ROMA Feedback Model

**Document ID:** ROMA-INT-CORE-008  
**Version:** 1.0  
**Date:** 2026-07-03  
**Status:** Stage 2A Architecture (design only)  
**Parent:** `ROMA_INTELLIGENCE_CORE.md`

---

## 1. Purpose

Defines how ROMA **learns from outcomes** — closing the loop between predictions (reasoning, regression, release confidence) and actual results without auto-modifying production code.

Feedback calibrates engineering confidence and updates Memory.

---

## 2. Responsibilities

| Owns | Does not own |
|------|--------------|
| Prediction vs outcome matching | Test implementation |
| Calibration metrics for engines | Auto-fix PRs |
| Feedback event schema | Product feature flags |
| Recommendation quality scoring | Deleting historical findings |

---

## 3. Feedback Loops

| Loop ID | Prediction | Outcome | Memory update |
|---------|------------|---------|---------------|
| FB-REGRESS | `failure_probability` per module | Actual failures in run | MEM-REGRESS, calibration delta |
| FB-SKIP | SKIP decision | Later failure in skipped area | MEM-RECUR; penalize skip policy |
| FB-RELEASE | `release_posture` / confidence % | Post-release incidents (7d/30d) | MEM-RELEASE |
| FB-FLAKE | Test passed after retry | Flake signature | MEM-FLAKE |
| FB-COVERAGE | Coverage debt priority | New failure in debt area | MEM-QUALITY |
| FB-AI | AI LIVE predicted | Fallback observed | MEM-RECUR on AI |
| FB-ARCH | Architecture health alert | Confirmed drift/incident | MEM-ADR |

---

## 4. Feedback Event Schema

```json
{
  "feedback_id": "FB-{run_id}-{seq}",
  "loop_id": "FB-REGRESS",
  "prediction_ref": "reasoning_trace/RD-....json",
  "prediction": { "failure_probability": 0.72, "module": "WEB/dashboard" },
  "outcome": { "failed": true, "finding_ids": ["..."] },
  "match": "true_positive",
  "calibration_delta": -0.08,
  "memory_writes": ["MEM-REGRESS-..."],
  "recommendation_adjustment": "Increase regression weight for dashboard edits"
}
```

### Match types

| Match | Meaning |
|-------|---------|
| `true_positive` | Predicted failure, failed |
| `true_negative` | Predicted safe, passed |
| `false_positive` | Predicted failure, passed |
| `false_negative` | Predicted safe, failed (highest severity) |
| `inconclusive` | UNKNOWN or incomplete outcome |

---

## 5. Inputs

| Input | Source |
|-------|--------|
| `reasoning_trace[]` | Prior run |
| `decision_bundle` | Decisions to track |
| Run findings | Actual results |
| Post-release incident feed | OBS, manual (future) |
| Council waivers | Accepted risk context |

---

## 6. Outputs

| Output | Consumer |
|--------|----------|
| `feedback_report.json` | QA RPT-QA, Architecture RPT-ARCH |
| `calibration_scores` | Risk, Regression engine tuning |
| `memory_delta` | Memory Model |
| `engine_recommendations[]` | Steward review (not auto-apply) |

---

## 7. Interfaces

| Partner | Contract |
|---------|----------|
| Memory Model | MEM-* writes |
| Learning Engine (Stage 2) | Implements ingestion |
| Reasoning Model | Calibration feeds Q4 confidence |
| Decision Engine | Skip policy refinement proposals |
| Release Model | Confidence calibration history |

---

## 8. Guardrails

| Rule | Policy |
|------|--------|
| FB-01 | False negatives on RT-Critical → mandatory steward review |
| FB-02 | Feedback never triggers auto code change (ADR-0007) |
| FB-03 | Post-release incidents without evidence → INVESTIGATE not auto-BLOCK retroactively |
| FB-04 | Calibration adjustments are recommendations until council/steward accepts |

---

## 9. Future Extensions

- Bayesian calibration layer on regression probabilities
- Feedback dashboard (Stage 8) with TP/FP/FN rates per engine
- Integration with external incident management (PagerDuty, etc.)
- Per-steward feedback SLA on false negatives

---

## 10. Open Questions

| ID | Question |
|----|----------|
| Q1 | Post-release incident ingest — manual only or OBS webhook? |
| Q2 | How many false negatives before engine weight mandate review? |
| Q3 | Feedback on council OVERRIDE decisions — separate loop? |

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-03 | Stage 2A feedback model |
