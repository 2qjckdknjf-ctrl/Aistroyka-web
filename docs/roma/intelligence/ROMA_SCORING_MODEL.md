# ROMA Scoring Model

**Document ID:** ROMA-INT-011  
**Version:** 1.0  
**Date:** 2026-07-03  
**Parent:** `ROMA_INTELLIGENCE.md`

---

## 1. Purpose

Unifies **scoring semantics** across PQS, Risk, Regression, Coverage, and Release Confidence — preventing incompatible scales across engines.

---

## 2. Score Families

| Family | Range | Used by |
|--------|-------|---------|
| **Verdict** | YES / NO / UNKNOWN / SKIPPED_WITH_REASON | Subsystems, domains |
| **Normalized** | 0.0 – 1.0 | Internal engine math |
| **Percent** | 0 – 100 | PQS, Release Confidence, risk_score |
| **Tier** | RT-* , T0–T3 | Risk, execution depth |
| **Severity** | P0–P3, R0–R4 | Findings |

---

## 3. Verdict → Normalized Mapping

| Verdict | Normalized | PQS factor | Confidence factor |
|---------|------------|------------|-------------------|
| YES | 1.0 | 1.0 | 1.0 |
| UNKNOWN | 0.35 | 0.3 (ADR-0001) | 0.35 |
| SKIPPED_WITH_REASON | 0.35 | → UNKNOWN | → UNKNOWN |
| NO | 0.0 | 0.0 | 0.0 |

*Intentional slight PQS vs Confidence UNKNOWN difference — council may harmonize via ADR.*

---

## 4. Risk Score → Tier Mapping

See `ROMA_RISK_ENGINE.md` §4.2.

---

## 5. Regression Likelihood → Priority

| Normalized likelihood | Priority band |
|----------------------|---------------|
| ≥ 0.75 | P0 |
| 0.5 – 0.74 | P1 |
| 0.25 – 0.49 | P2 |
| < 0.25 | P3 |

---

## 6. Coverage Debt Score

```
debt_pressure = Σ (uncovered_item_weight × risk_tier_factor × age_factor)
```

Feeds Planner (include debt probes) and Confidence (penalty).

---

## 7. Composite Rules

| Rule | Description |
|------|-------------|
| SC-01 | R0 caps Release Confidence at 0 |
| SC-02 | PQS never overrides R0 (ADR-0001) |
| SC-03 | Worst-slice-wins for subsystem verdict |
| SC-04 | Intelligence scores are advisory until REL applies ADR-0002 |

---

## 8. Versioning

`scoring_model_version: "sm_v1"` in `run_meta.json`.

---

## 9. Rationale

Single scoring lexicon prevents "72 risk" vs "0.72" vs "HIGH" confusion in council briefs.

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-03 | Initial scoring model |
