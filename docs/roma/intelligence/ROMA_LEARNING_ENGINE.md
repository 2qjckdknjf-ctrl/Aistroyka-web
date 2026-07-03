# ROMA Learning Engine

**Document ID:** ROMA-INT-005  
**Version:** 1.0  
**Date:** 2026-07-03  
**Parent:** `ROMA_INTELLIGENCE.md`

---

## 1. Purpose

Accumulates **patterns** from runs to improve Risk, Regression, Planner, and Confidence — **recommendation-only**, never auto-modifying product code.

Extends ROMA subsystem `LRN` with intelligence-specific learning stores.

---

## 2. Responsibilities

| Owns | Does not own |
|------|--------------|
| Historical pattern stores | Blocking release alone |
| Flake quarantine recommendations | Fixing product bugs |
| Calibration feedback for Regression | Retraining production ML |

---

## 3. Stored Knowledge Types

| Store ID | Content |
|----------|---------|
| `LKP-BUG` | Repeated bugs by module + signature |
| `LKP-FLAKE` | Flaky tests: rate, last flake, quarantine TTL |
| `LKP-RISK` | Modules with elevated historical risk |
| `LKP-REL` | Release failures linked to run_id |
| `LKP-REG` | Regression history: forecast vs actual |
| `LKP-UX` | Recurring UX/a11y violations |
| `LKP-AI` | AI failures: fallback, leakage, provider |
| `LKP-PERF` | Performance regressions vs baseline |

---

## 4. Inputs

| Input | Source |
|-------|--------|
| `findings.jsonl` | All runs |
| `RELEASE_VERDICT.json` | Council outcomes |
| Forecast records | Regression Engine |
| Planner skip log | UNKNOWN reasons |
| Subsystem verdicts | Per slice |

---

## 5. Outputs

| Output | Consumer |
|--------|----------|
| `learning_delta.md` | Humans, Executive report |
| `recommendations[]` | Sprint planning, ADR suggestions |
| `flake_quarantine_list` | Planner skip rules |
| `module_stability_index` | Risk Engine IN-HIST |
| `repeated_failure_signatures` | Regression γ factor |

### Recommendation types only

| Type | Example |
|------|---------|
| `ADD_TEST` | "Add stakeholder portal probe for COV-FLOW-07" |
| `INCREASE_TIER` | "Raise BCK-api-ai to T2 for 14d" |
| `QUARANTINE` | "Mark WEB-dashboard-nav flaky TTL 7d" |
| `ADR_SUGGEST` | "Council review PQS weight for CAT-AI" |
| `OPS_ACTION` | "Provision pilot_foreman profile" |

**Forbidden:** `AUTO_FIX_CODE`, `AUTO_DEPLOY`, `AUTO_MERGE`

---

## 6. Learning Loop

```
Run completes → ingest findings → update stores
→ recompute module_stability_index
→ emit recommendations (no automatic plan mutation without Planner read)
```

Human or council may promote recommendation to **blocking gate** via ADR — never automatic.

---

## 7. Rationale

Institutional memory prevents rediscovering same gaps; quarantine reduces flake noise without hiding debt.

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-03 | Initial learning engine spec |
