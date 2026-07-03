# ROMA Planner Engine

**Document ID:** ROMA-INT-002  
**Version:** 1.0  
**Date:** 2026-07-03  
**Parent:** `ROMA_INTELLIGENCE.md`

---

## 1. Purpose

Selects **what tests run**, **what skips**, **which environments**, and **estimated duration** — producing the `run_plan` ROMA Core executes.

Replaces static "run everything" with risk- and change-aware manifests.

---

## 2. Responsibilities

| Owns | Does not own |
|------|--------------|
| Test selection and skip justification | Running tests |
| Tier selection per module | Verdict aggregation |
| Environment + profile requirements | Credential storage |

---

## 3. Inputs

| Input | Source |
|-------|--------|
| Changed files / modules | Git diff, inventory mapping |
| `risk_manifest` | Risk Engine |
| Recent failures | Learning Engine |
| Coverage gaps | Coverage Engine |
| Regression predictions | Regression Engine |
| Dependency graph | Knowledge Graph |
| Trigger context | Core (PR, nightly, council) |
| Time budget | Tier defaults + CI timeout |
| Credential availability | ADR-0003 resolution |

---

## 4. Planning Algorithm (conceptual)

```
1. Resolve base_tier from trigger (T0/T1/T2/T3 per ROMA_EXECUTION_MODEL)
2. For each module in affected set (diff ∪ risk_top ∪ coverage_debt):
     effective_tier = max(base_tier, risk.recommended_tier)
     if credentials missing for slice → mark SKIPPED_WITH_REASON
     if regression.confidence > threshold → include regression-targeted probes
3. Apply Priority Engine ordering under time budget
4. Emit run_plan with estimates
```

---

## 5. Outputs

| Output | Schema owner |
|--------|--------------|
| `run_plan.json` | Core |
| `tests_to_run[]` | module_id, slice, tier, persona, est_seconds |
| `tests_to_skip[]` | module_id, reason, maps_to UNKNOWN |
| `required_environments[]` | env_id, base_url, profiles |
| `estimated_duration_seconds` | sum with parallelization factor |
| `planner_rationale` | human-readable markdown |

### Skip reasons (canonical)

| Reason code | Verdict impact |
|-------------|----------------|
| `CREDENTIAL_MISSING` | UNKNOWN |
| `TIER_BUDGET_EXCEEDED` | UNKNOWN for deferred slices |
| `RISK_TOO_LOW` | Documented; not failure |
| `QUARANTINE_FLAKE` | UNKNOWN unless council overrides |
| `ENV_UNAVAILABLE` | UNKNOWN |

---

## 6. Interfaces

| Consumer | Interface |
|----------|-----------|
| ROMA Core | `plan(run_context) → RunPlan` |
| Priority Engine | receives candidate list, returns order |
| Release Confidence | uses `coverage_of_plan` metric |

---

## 7. Rationale

Change-aware planning reduces CI cost while increasing depth where diff and risk demand it — core enterprise QA efficiency pattern.

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-03 | Initial planner spec |
