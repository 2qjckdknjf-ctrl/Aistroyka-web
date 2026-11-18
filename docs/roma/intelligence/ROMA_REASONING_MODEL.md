# ROMA Reasoning Model

**Document ID:** ROMA-INT-CORE-002  
**Version:** 1.0  
**Date:** 2026-07-03  
**Status:** Stage 2A Architecture (design only)  
**Parent:** `ROMA_INTELLIGENCE_CORE.md`

---

## 1. Purpose

Defines **how ROMA reasons** — the mandatory question set, inference order, and confidence propagation for every engineering decision.

Reasoning is explicit, auditable, and evidence-bound. ROMA does not emit verdicts without traversing this model.

---

## 2. Responsibilities

| Owns | Does not own |
|------|--------------|
| Nine-question reasoning schema | Engine-specific scoring formulas |
| Inference ordering and dependency rules | Test selection algorithms (Planner) |
| Confidence composition from evidence gaps | PQS weight table |
| `reasoning_trace` artifact structure | Human council deliberation |

---

## 3. The Nine Reasoning Questions

Every decision (test plan, skip, release state, architecture alert) must answer:

| # | Question | Field ID | Required output |
|---|----------|----------|-----------------|
| 1 | **What changed?** | `change_summary` | Diff, deploy SHA, inventory delta, trigger |
| 2 | **Why does it matter?** | `materiality` | Business/technical significance narrative |
| 3 | **Who is affected?** | `affected_actors` | Roles, tenants, surfaces, customers, ops |
| 4 | **What is the probability of failure?** | `failure_probability` | 0.0–1.0 + method (regression, history, heuristic) |
| 5 | **What is the impact?** | `impact` | Severity P0–P3, risk R0–R4, blast radius |
| 6 | **What evidence exists?** | `evidence_present[]` | Refs per `ROMA_EVIDENCE_MODEL.md` |
| 7 | **What evidence is missing?** | `evidence_gaps[]` | Typed gaps → UNKNOWN contribution |
| 8 | **What action is recommended?** | `recommendation` | Run/skip/block/defer/investigate |
| 9 | **How confident is this recommendation?** | `recommendation_confidence` | 0–100% with cap rules |

*Rationale:* Forces traceable judgment — prevents "green because we didn't look."

---

## 4. Reasoning Pipeline (Inference Order)

```
1. change_summary      ← change detection + inventory
2. affected_actors     ← knowledge graph impact_radius
3. materiality         ← risk model + business criticality
4. failure_probability ← regression + memory (recurring failures)
5. impact              ← risk tier + finance/tenant flags
6. evidence_present    ← current/prior run artifacts
7. evidence_gaps       ← coverage debt + missing profiles
8. recommendation      ← decision engine synthesis
9. recommendation_confidence ← scoring model + gap penalties
```

Later steps may refine earlier steps (max 2 refinement passes); each pass logged in `reasoning_trace.refinements[]`.

---

## 5. Inputs

| Input | Source |
|-------|--------|
| `change_set` | Git, deploy, manual |
| `impact_radius` | Knowledge Model |
| `risk_manifest` | Risk Engine (Stage 2) |
| `regression_forecast` | Regression Engine |
| `coverage_debt` | Coverage Engine |
| `memory_facts` | Memory Model |
| `evidence_index` | Current/prior runs |
| Policy flags | ADR-0002, finance G-001 |

---

## 6. Outputs

### `reasoning_trace.json` (per decision unit)

```json
{
  "decision_id": "RD-{run_id}-{seq}",
  "decision_unit": "module|flow|release",
  "unit_ref": "WEB/dashboard",
  "questions": {
    "change_summary": { "text": "...", "refs": [] },
    "materiality": { "text": "...", "score_norm": 0.82 },
    "affected_actors": { "roles": [], "surfaces": [], "tenant_scope": "fixture" },
    "failure_probability": { "value": 0.61, "method": "regression+history" },
    "impact": { "severity": "P1", "risk_class": "R2", "blast_radius_nodes": 14 },
    "evidence_present": [{ "type": "EV-SCREEN", "ref": "..." }],
    "evidence_gaps": [{ "type": "COV-ROLE", "detail": "stakeholder portal untested" }],
    "recommendation": { "action": "RUN_T1", "targets": ["SEC-finance-probe"] },
    "recommendation_confidence": { "percent": 58, "caps_applied": ["UNKNOWN_DOMAIN"] }
  },
  "rationale_summary": "Human-readable 2–3 sentences",
  "governance_ref": ["ADR-0007", "sm_v1"]
}
```

---

## 7. Interfaces

| Consumer | Usage |
|----------|-------|
| Decision Engine | Aggregates traces into `decision_bundle` |
| Executive Reporting | Embeds rationale in RPT-* |
| Release Model | Release-level trace rollup |
| Memory Model | Stores high-signal reasoning outcomes |
| Feedback Model | Compares predicted vs actual for calibration |

---

## 8. Confidence Rules

| Condition | Confidence cap |
|-----------|----------------|
| Any R0 unresolved | 0% for release GO |
| RT-Critical module with evidence gap | −15% per gap (max −45%) |
| UNKNOWN domain on council path | 40% max for Production Ready |
| Stale evidence (>30d) on RT-Critical | 50% max for that unit |
| Full evidence on unit | No artificial cap |

Aligned with `ROMA_SCORING_MODEL.md` and `ROMA_RELEASE_CONFIDENCE_ENGINE.md`.

---

## 9. Future Extensions

- Reasoning templates per subsystem (WEB vs AI vs mobile)
- Counterfactual reasoning ("if we skip X, expected exposure Y")
- Cross-run reasoning diff for trend narratives
- Structured debate mode: two reasoning paths (optimist/pessimist) merged by Decision Engine

---

## 10. Open Questions

| ID | Question |
|----|----------|
| Q1 | Minimum reasoning depth for T0 vs T2 — all nine questions always, or abbreviated T0? |
| Q2 | Should `failure_probability` be calibrated against historical hit rate? |
| Q3 | Public export of reasoning traces — redaction policy for stakeholder reports? |

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-03 | Stage 2A reasoning model |
