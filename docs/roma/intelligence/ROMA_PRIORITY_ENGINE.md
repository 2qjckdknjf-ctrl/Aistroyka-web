# ROMA Priority Engine

**Document ID:** ROMA-INT-012  
**Version:** 1.0  
**Date:** 2026-07-03  
**Parent:** `ROMA_INTELLIGENCE.md`

---

## 1. Purpose

Orders candidate tests under **time and resource budget** — maximizing risk reduction per minute.

---

## 2. Responsibilities

| Owns | Does not own |
|------|--------------|
| Execution order within `run_plan` | Selecting which tests exist |
| Budget truncation decisions | Running tests |

---

## 3. Inputs

| Input | Source |
|-------|--------|
| Candidate tests | Planner |
| `risk_score` | Risk Engine |
| `regression_likelihood` | Regression Engine |
| `coverage_debt` pressure | Coverage Engine |
| `estimated_duration` | Subsystem metadata |
| `parallel_groups` | Core PAR rules |
| `time_budget_seconds` | Tier + CI limit |

---

## 4. Priority Formula (v1)

```
priority_score(test) =
  0.35 × risk_score_norm
+ 0.30 × regression_likelihood_norm
+ 0.20 × coverage_debt_norm
+ 0.10 × business_criticality_norm
+ 0.05 × recency_failure_boost

Sort descending; greedily pack until budget exhausted.
```

---

## 5. Outputs

| Output | Description |
|--------|-------------|
| `execution_order[]` | test ids |
| `deferred_tests[]` | with `TIER_BUDGET_EXCEEDED` |
| `estimated_utilization` | % of budget used |
| `priority_rationale` | top 10 why-first |

---

## 6. Constraints

| Constraint | Rule |
|------------|------|
| RT-Critical modules | At least one probe in T1+ before low-priority tests |
| R0 probes | Always first in order |
| AI LIVE gate | Never deferred on AI-touching releases |
| Finance isolation | Never deferred on prod promotion path |
| PAR-04 | Serialize AI probes per project_fixture |

---

## 7. Interfaces

- **Planner:** consumes ordered list for final `run_plan`  
- **Executive QA report:** shows deferred items  

---

## 8. Rationale

Without prioritization, time-budget skips become random — violates fail-closed intent.

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-03 | Initial priority engine spec |
