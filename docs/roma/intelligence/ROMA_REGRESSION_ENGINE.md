# ROMA Regression Engine

**Document ID:** ROMA-INT-003  
**Version:** 1.0  
**Date:** 2026-07-03  
**Parent:** `ROMA_INTELLIGENCE.md`

---

## 1. Purpose

Predicts **which modules are likely to fail** given a change set — before execution completes — to prioritize probes and set release confidence expectations.

---

## 2. Responsibilities

| Owns | Does not own |
|------|--------------|
| Regression likelihood per module | Confirming failures (subsystems do) |
| Confidence on predictions | Auto-blocking without evidence |

---

## 3. Inputs

| Input | Description |
|-------|-------------|
| Git diff | Files, hunks, rename detection |
| Dependency graph | Transitive impact from Knowledge Graph |
| Historical bugs | Learning store: module → failure tags |
| Prior run outcomes | Same-module failure within N runs |
| Change classifiers | API schema, RLS, i18n, AI prompt, middleware |

---

## 4. Prediction Model (heuristic v1)

```
regression_likelihood(module) =
  α × direct_change_score
+ β × transitive_dependency_score
+ γ × historical_failure_rate
+ δ × change_class_risk_weight

confidence = f(sample_size, recency, graph_completeness)
```

| Change class | Weight (default) | Example |
|--------------|------------------|---------|
| `auth_middleware` | 1.0 | session, RBAC |
| `api_contract` | 0.9 | route handler |
| `rls_policy` | 1.0 | migration |
| `ai_provider` | 0.85 | copilot router |
| `i18n_copy` | 0.3 | messages only |
| `css_only` | 0.2 | public shell |

---

## 5. Outputs

| Output | Fields |
|--------|--------|
| `regression_forecast.json` | per module: `likelihood`, `confidence`, `priority`, `reasons[]` |
| `likely_fail_modules[]` | sorted by likelihood × business criticality |
| `new_failure_risk` | modules with no history but high change score |

### Priority mapping

| Likelihood × confidence | Planner priority |
|-------------------------|------------------|
| High × High | P0 probe inclusion |
| High × Low | P1 include sample |
| Low × any | Defer unless RT-Critical |

---

## 6. Interfaces

- **Planner:** adds probes for top-N forecast modules  
- **Release Confidence:** reduces confidence % when high-likelihood modules untested  
- **Learning:** records forecast vs actual for calibration  

---

## 7. Rationale

Shift-left prioritization — run the tests most likely to catch regressions first under time budget.

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-03 | Initial regression engine spec |
