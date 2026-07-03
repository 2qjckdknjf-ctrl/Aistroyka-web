# ROMA Decision Pipeline

**Document ID:** ROMA-INT-009  
**Version:** 1.0  
**Date:** 2026-07-03  
**Parent:** `ROMA_INTELLIGENCE.md`

---

## 1. Purpose

Defines the **end-to-end intelligence flow** from change detection through report generation — the canonical orchestration sequence for ROMA Intelligence + Core.

---

## 2. Pipeline Stages

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. CHANGE DETECTED                                                │
│    Git diff · deploy SHA · manual trigger · inventory delta       │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. INVENTORY & GRAPH SYNC (Core + Knowledge Graph)              │
│    inventory_hash · impact_radius(change_set)                   │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. RISK CALCULATED (Risk Engine)                                │
│    risk_manifest.json per module                                │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. REGRESSION FORECAST (Regression Engine)                      │
│    regression_forecast.json                                     │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. COVERAGE DEBT LOADED (Coverage Engine)                       │
│    uncovered flows/roles/apis merged into candidate set         │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. PLANNER SELECTS TESTS (Planner + Priority Engine)            │
│    run_plan.json · tests_to_run · tests_to_skip                 │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. CORE EXECUTION (Subsystem adapters — future implementation)  │
│    plan → execute → collect → subsystem verdicts                │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. EVIDENCE COLLECTED (Evidence Model)                          │
│    findings.jsonl · artifacts/                                │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 9. SCORING (Scoring Model + PQS)                                │
│    DOMAIN_VERDICT_BOARD · PQS.json                              │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 10. COVERAGE UPDATED (Coverage Engine)                          │
│     coverage_map delta · debt register                            │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 11. LEARNING UPDATED (Learning Engine)                          │
│     stores · recommendations · flake quarantine               │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 12. RELEASE CONFIDENCE (Release Confidence Engine)              │
│     release_confidence.json · state                             │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 13. REPORTS GENERATED (Executive Reporting + REL)                 │
│     RPT-* · COUNCIL_BRIEF.md · RELEASE_VERDICT.json              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Trigger Variants

| Trigger | Stages skipped | Notes |
|---------|----------------|-------|
| PR sync | 7 shallow (T1), may skip 4 if no diff | Fast path |
| Post-deploy T0 | 4–5 light, 7 smoke only | Blocking per ADR-0002 |
| Council T2 | Full pipeline | All engines |
| Manual re-score | 9–13 only | Re-evaluate existing artifacts |

---

## 4. Failure Handling

| Failure point | Behavior |
|---------------|----------|
| Engine crash | Core logs UNKNOWN for that engine output; pipeline continues |
| Missing graph | Regression uses direct diff only; lower confidence |
| Execution abort | Stages 10–13 run on partial evidence; Confidence capped |

---

## 5. Interfaces

| Stage | Input contract | Output contract |
|-------|----------------|-----------------|
| 3 | `change_set`, `graph` | `risk_manifest.json` |
| 6 | risk + forecast + coverage | `run_plan.json` |
| 12 | verdicts + learning | `release_confidence.json` |

All contracts versioned in `docs/roma/schemas/` (future).

---

## 6. Rationale

Single documented pipeline prevents engines operating in silos with contradictory plans.

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-03 | Initial decision pipeline |
