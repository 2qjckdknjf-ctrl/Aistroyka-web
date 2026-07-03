# ROMA State Machine

**Document ID:** ROMA-INT-CORE-010  
**Version:** 1.0  
**Date:** 2026-07-03  
**Status:** Stage 2A Architecture (design only)  
**Parent:** `ROMA_INTELLIGENCE_CORE.md`  
**Aligns with:** `ROMA_DECISION_PIPELINE.md` (Stage 2 operational flow)

---

## 1. Purpose

Defines the **intelligence lifecycle** — formal states, transitions, and guards for how ROMA progresses from change detection to knowledge update.

The state machine is the **temporal backbone** of engineering reasoning.

---

## 2. Responsibilities

| Owns | Does not own |
|------|--------------|
| State IDs and transition guards | CI job scheduling |
| `state_snapshot.json` schema | Adapter process management |
| Failure and partial-run semantics | Git operations |
| Re-entrancy rules (re-score, partial) | Council meeting timing |

---

## 3. States

| State ID | Name | Description |
|----------|------|-------------|
| `S0_IDLE` | Idle | No active intelligence cycle |
| `S1_CHANGE_DETECTED` | Change detected | Trigger received; change_set captured |
| `S2_IMPACT_ANALYZED` | Impact analyzed | Knowledge model blast radius computed |
| `S3_RISK_CALCULATED` | Risk calculated | Risk manifest + regression forecast ready |
| `S4_TESTS_SELECTED` | Tests selected | Planner + Priority + Decision bundle committed |
| `S5_EVIDENCE_COLLECTED` | Evidence collected | Core/adapters finished; artifacts indexed |
| `S6_DECISION_GENERATED` | Decision generated | Reasoning traces + release posture finalized |
| `S7_KNOWLEDGE_UPDATED` | Knowledge updated | Memory, graph, feedback deltas committed |
| `S8_REPORTED` | Reported | RPT-* and council inputs emitted |
| `SX_ERROR` | Error | Unrecoverable; partial outputs preserved |
| `SX_PARTIAL` | Partial | Budget/abort; downstream runs with caps |

---

## 4. Lifecycle Diagram

```
                    ┌──────────────┐
                    │   S0_IDLE    │
                    └──────┬───────┘
                           │ trigger
                           ▼
                    ┌──────────────┐
                    │S1_CHANGE_    │
                    │  DETECTED    │
                    └──────┬───────┘
                           │ inventory_sync
                           ▼
                    ┌──────────────┐
                    │S2_IMPACT_    │
                    │  ANALYZED    │
                    └──────┬───────┘
                           │ risk + regress + coverage_load
                           ▼
                    ┌──────────────┐
                    │S3_RISK_      │
                    │ CALCULATED   │
                    └──────┬───────┘
                           │ plan + decide
                           ▼
                    ┌──────────────┐
                    │S4_TESTS_     │
                    │  SELECTED    │
                    └──────┬───────┘
                           │ core_execute
                           ▼
                    ┌──────────────┐
                    │S5_EVIDENCE_  │
                    │  COLLECTED   │
                    └──────┬───────┘
                           │ reason + score + release_assess
                           ▼
                    ┌──────────────┐
                    │S6_DECISION_  │
                    │  GENERATED   │
                    └──────┬───────┘
                           │ memory + graph + feedback
                           ▼
                    ┌──────────────┐
                    │S7_KNOWLEDGE_ │
                    │  UPDATED     │
                    └──────┬───────┘
                           │ report
                           ▼
                    ┌──────────────┐
                    │  S8_REPORTED │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   S0_IDLE    │
                    └──────────────┘
```

---

## 5. Transition Guards

| Transition | Guard | On failure |
|------------|-------|------------|
| S1 → S2 | `inventory_hash` valid or stale with flag | Continue with reduced confidence |
| S2 → S3 | Knowledge graph loadable | S3 with direct-diff-only mode |
| S3 → S4 | Risk manifest present | SX_PARTIAL if empty |
| S4 → S5 | Core accepts `run_plan` | SX_ERROR if invalid schema |
| S5 → S6 | ≥1 evidence artifact or explicit gap list | S6 with UNKNOWN caps |
| S6 → S7 | `decision_bundle` committed | SX_PARTIAL |
| S7 → S8 | Memory write ack (or file flush) | S8 with warning flag |
| Any → SX_ERROR | Unhandled exception | Preserve `state_snapshot` |

---

## 6. Inputs

| Input | Effect |
|-------|--------|
| `trigger_context` | May skip states (re-score: S5→S6 only) |
| `tier` | S4 breadth; T0 may skip deep S2 graph |
| Engine failures | SX_PARTIAL vs continue per pipeline rules |
| Manual abort | SX_PARTIAL with collected evidence |

---

## 7. Outputs

### `state_snapshot.json`

```json
{
  "run_id": "...",
  "current_state": "S6_DECISION_GENERATED",
  "previous_state": "S5_EVIDENCE_COLLECTED",
  "entered_at": "ISO8601",
  "transition_log": [
    { "from": "S5_EVIDENCE_COLLECTED", "to": "S6_DECISION_GENERATED", "guard": "decision_bundle_committed" }
  ],
  "partial": false,
  "confidence_caps": ["UNKNOWN_DOMAIN"],
  "cognitive_contract_version": "cog_v1"
}
```

---

## 8. Interfaces

| Consumer | Usage |
|----------|-------|
| Decision Pipeline | Operational step mapping |
| Core orchestrator | Resume from last state |
| OBS | State timing metrics |
| Dashboard (Stage 8) | Live cycle visualization |

### Mapping to Decision Pipeline (Stage 2)

| State machine | Pipeline stage |
|---------------|----------------|
| S1 | Change detected |
| S2 | Inventory & graph sync |
| S3 | Risk + regression + coverage load |
| S4 | Planner + priority |
| S5 | Execution + evidence |
| S6 | Scoring + confidence + decide |
| S7 | Coverage + learning + feedback |
| S8 | Reports |

---

## 9. Alternate Paths

| Path | Entry | States |
|------|-------|--------|
| PR fast (T1) | S1 | S1→S2 light→S3→S4 shallow→S5→S6→S8 (S7 async) |
| Re-score | S5 artifacts exist | S5→S6→S7→S8 |
| Council T2 | S1 | Full S1–S8 |
| Intelligence-only dry run | S1 | S1→S2→S3→S4 (no S5) |

---

## 10. Future Extensions

- Parallel substates (S5a WEB, S5b BCK) with join guard
- Durable workflow engine (Temporal-style) backing transitions
- State machine replay for audits
- SLA timers per state (alert if S5 > 3h)

---

## 11. Open Questions

| ID | Question |
|----|----------|
| Q1 | Is S7 allowed to async lag S8 for PR speed? |
| Q2 | Persist state in Core DB vs `run_meta.json` only? |
| Q3 | Multiple concurrent cycles per repo — lock semantics? |

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-03 | Stage 2A state machine |
