# ROMA Release Confidence Engine

**Document ID:** ROMA-INT-006  
**Version:** 1.0  
**Date:** 2026-07-03  
**Parent:** `ROMA_INTELLIGENCE.md`

---

## 1. Purpose

Synthesizes execution results, predictions, coverage, and history into **Release Confidence %** and readiness states: Pilot Ready, Production Ready, Blocked.

Complements PQS (ADR-0001) with forward-looking and completeness-aware judgment.

---

## 2. Responsibilities

| Owns | Does not own |
|------|--------------|
| Release Confidence % formula | Council GO vote |
| Pilot / Production readiness labels | Deploy button |
| Blocked state with reasons | PQS category weights |

---

## 3. Inputs

| Input | Source | Weight in formula |
|-------|--------|-------------------|
| Functional quality | Domain verdicts CAT-FUNC | 18% |
| Backend reliability | CAT-BCK | 12% |
| Security / RBAC / tenant | CAT-SEC | 14% |
| AI readiness | CAT-AI | 11% |
| Performance | CAT-PERF | 8% |
| Accessibility | CAT-A11Y | 7% |
| Coverage completeness | Coverage Engine debt | 10% |
| Regression prediction accuracy | Regression forecast vs actual | 8% |
| Historical stability | Learning `module_stability_index` | 7% |
| PQS | `ROMA_PROJECT_QUALITY_SCORE.md` | 5% (correlation check) |

*Weights sum to 100 for confidence components — distinct from PQS weights but aligned in spirit.*

---

## 4. Release Confidence Formula (v1)

```
confidence_raw = Σ (component_weight × component_score)

component_score:
  YES / stable     → 1.0
  UNKNOWN / partial → 0.35
  NO / unstable    → 0.0

Adjustments:
  - open R0: confidence_cap = 0 (Blocked)
  - open P0: confidence_cap = 40
  - high regression_likelihood untested modules: -5% each (max -25%)
  - RT-Critical coverage debt: -10%

Release_Confidence_% = clamp(0, 100, confidence_raw + adjustments)
```

---

## 5. Output States

| State | Conditions |
|-------|------------|
| **Production Ready** | Confidence ≥ 75, R0=0, P0=0, PQS ≥ 70, required domains not UNKNOWN |
| **Pilot Ready** | Confidence ≥ 55, R0=0, PQS ≥ 55, finance isolation probed if prod path |
| **Blocked** | R0 > 0 OR Confidence < 40 OR explicit NO on RT-Critical module |
| **Insufficient Evidence** | >3 required UNKNOWN domains |

---

## 6. Outputs

| Artifact | Consumer |
|----------|----------|
| `release_confidence.json` | REL, Council brief |
| `confidence_%` | Executive report |
| `state` | Pilot / Production / Blocked / Insufficient |
| `blocking_reasons[]` | ADR-0002 alignment |
| `confidence_delta` vs last run | Learning |

---

## 7. Relationship to PQS

| Metric | Role |
|--------|------|
| PQS | Backward-looking quality score from verdicts |
| Release Confidence | Forward + completeness + stability narrative |

Both required in council brief; either can block per ADR-0002.

---

## 8. Rationale

Council needs a single interpretable % plus explicit state — PQS alone does not encode regression risk or coverage debt.

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-03 | Initial release confidence spec |
