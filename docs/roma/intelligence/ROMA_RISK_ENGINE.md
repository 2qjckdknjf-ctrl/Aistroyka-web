# ROMA Risk Engine

**Document ID:** ROMA-INT-001  
**Version:** 1.0  
**Date:** 2026-07-03  
**Parent:** `ROMA_INTELLIGENCE.md`

---

## 1. Purpose

Scores every **module** (subsystem slice, route cluster, business flow, or graph node) to drive testing depth, blocking policy, and planner prioritization.

---

## 2. Responsibilities

| Owns | Does not own |
|------|--------------|
| Per-module risk score and tier | Test execution |
| Recommended testing depth (T0–T3) | Release council vote |
| Blocking policy recommendation | PQS computation (feeds Confidence) |

---

## 3. Inputs

| Input ID | Source | Description |
|----------|--------|-------------|
| `IN-BC` | Product / roadmap | Business criticality (0–5) |
| `IN-SEC` | SEC catalog, ADR-0002 | Security exposure (R0 potential) |
| `IN-DIFF` | Git / CI | Recent commits touching module |
| `IN-HIST` | ROMA Learning | Historical failure rate, flake rate |
| `IN-REL` | Release context | Release importance (hotfix, major, pilot) |
| `IN-AI` | Module registry | AI involvement (copilot, vision, streaming) |
| `IN-UX` | Product analytics (future) | User impact / journey criticality |
| `IN-DATA` | Security taxonomy | Data sensitivity (PII, tenant, finance) |
| `IN-MOB` | Knowledge graph | Mobile client dependency |
| `IN-BCK` | Knowledge graph | Backend API dependency depth |

---

## 4. Risk Score Model

### 4.1 Formula (heuristic v1)

```
risk_score = clamp(0, 100,
  w_bc  × business_criticality_norm × 10
+ w_sec × security_exposure_norm × 10
+ w_chg × change_magnitude_norm × 10
+ w_hist × failure_history_norm × 10
+ w_rel × release_importance_norm × 10
+ w_ai  × ai_involvement_norm × 10
+ w_ux  × user_impact_norm × 10
+ w_data × data_sensitivity_norm × 10
+ w_mob × mobile_impact_norm × 10
+ w_bck × backend_dependency_norm × 10
)

Default weights w_* = 1.0 (council tunable via ADR amendment)
```

All `*_norm` values ∈ [0, 1], derived from raw signals with documented transforms.

### 4.2 Risk tiers

| Tier | Score range | Recommended depth | Blocking recommendation |
|------|-------------|-------------------|-------------------------|
| **RT-Critical** | 80–100 | T2 minimum; T3 if chaos-eligible | Block release if module NO and tier ≥ RT-Critical |
| **RT-High** | 60–79 | T1–T2 | Warn; block on P0 in module |
| **RT-Medium** | 35–59 | T1 | Advisory |
| **RT-Low** | 15–34 | T0 | Skip deep slices with reason |
| **RT-Minimal** | 0–14 | T0 sample only | May skip if coverage debt accepted |

### 4.3 AISTROYKA overrides

| Module class | Floor tier | Rationale |
|--------------|------------|-----------|
| Stakeholder / portal finance surfaces | RT-Critical | Customer finance isolation |
| Tenant isolation / RLS | RT-Critical | Existential trust |
| AI copilot + streaming | RT-High | Governance + leakage |
| Lite mobile worker sync | RT-High | Field ops dependency |
| Public marketing | RT-Medium | Acquisition, lower data risk |

---

## 5. Outputs

| Output | Consumer |
|--------|----------|
| `risk_manifest.json` per run | Planner, Priority, Confidence |
| Per-module: `risk_score`, `risk_tier`, `recommended_tier` | Planner |
| `blocking_recommendation` (advisory) | Release Confidence, REL |
| `risk_delta` vs prior run | Learning, Executive report |

### `risk_manifest` record (minimum)

```yaml
module_id: BCK-api-projects
risk_score: 72
risk_tier: RT-High
recommended_tier: T2
factors:
  change_magnitude: 0.8
  historical_failures: 0.4
  security_exposure: 0.6
blocking_recommendation: warn_on_no
rationale: "77 project routes changed in diff; 2 P1 failures last 14d"
```

---

## 6. Dependencies

- Knowledge Graph (dependency edges)  
- Learning Engine (history)  
- Git diff / inventory (change magnitude)  
- ADR-0002 (blocking policy alignment)  

---

## 7. Rationale

Weighted heuristic model is explainable to council — required for enterprise QA. ML may augment later but must not replace auditable factors.

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-03 | Initial risk engine spec |
