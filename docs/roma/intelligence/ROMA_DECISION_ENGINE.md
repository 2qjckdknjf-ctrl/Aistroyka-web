# ROMA Decision Engine

**Document ID:** ROMA-INT-CORE-003  
**Version:** 1.0  
**Date:** 2026-07-03  
**Status:** Stage 2A Architecture (design only)  
**Parent:** `ROMA_INTELLIGENCE_CORE.md`

---

## 1. Purpose

Synthesizes reasoning traces, engine outputs, and policy constraints into **actionable decision bundles** — the single intelligence output Core and Release consume.

The Decision Engine is the **commit point of cognition**: it chooses recommended actions but does not execute them.

---

## 2. Responsibilities

| Owns | Does not own |
|------|--------------|
| Decision types and precedence rules | Subsystem test execution |
| `decision_bundle.json` schema | ADR-0002 enforcement (Core/REL) |
| Conflict resolution between engines | Council vote |
| Skip/defer/run/block semantics | Writing product code |

---

## 3. Decision Types

| Type ID | Action | When emitted |
|---------|--------|--------------|
| `RUN` | Execute named tests/slices at tier T | Risk + coverage + regression justify |
| `SKIP` | Omit with documented reason | Low risk + covered + budget; → UNKNOWN if RT-Critical |
| `DEFER` | Postpone to next tier/run | Budget exceeded; Priority Engine input |
| `BLOCK` | Recommend no release / no merge | R0, P0, policy violation |
| `INVESTIGATE` | Human triage before rerun | Conflicting signals, novel failure |
| `MONITOR` | Observe without immediate test | Low probability, good historical stability |

---

## 4. Precedence Rules

```
BLOCK > INVESTIGATE > RUN > DEFER > SKIP > MONITOR
```

| Rule ID | Rule |
|---------|------|
| DE-01 | Any R0 → at least one BLOCK decision on release unit |
| DE-02 | Finance isolation path → RUN SEC probe; SKIP → BLOCK on prod promotion |
| DE-03 | AI code touched → RUN AI LIVE classification; SKIP → UNKNOWN not YES |
| DE-04 | Conflicting engine scores → INVESTIGATE, not SKIP |
| DE-05 | SKIP on RT-Critical requires council_ack flag or stays UNKNOWN |
| DE-06 | Intelligence decisions are advisory until REL applies ADR-0002 |

---

## 5. Inputs

| Input | Source |
|-------|--------|
| `reasoning_trace[]` | Reasoning Model |
| `risk_manifest.json` | Risk Engine |
| `regression_forecast.json` | Regression Engine |
| `coverage_map` / debt | Coverage Engine |
| `run_plan` draft | Planner + Priority |
| `release_confidence` draft | Release Confidence Engine |
| `memory_recommendations[]` | Memory / Feedback |
| Policy matrix | ADR-0002, ADR-0007, G-001 |

---

## 6. Outputs

### `decision_bundle.json`

```json
{
  "bundle_id": "DB-{run_id}",
  "run_id": "...",
  "trigger": "pr|deploy|council|manual",
  "decisions": [
    {
      "decision_id": "RD-...",
      "type": "RUN",
      "targets": ["WEB-auth-smoke", "SEC-finance-denylist"],
      "tier": "T1",
      "confidence": 72,
      "rationale_ref": "reasoning_trace/RD-....json",
      "blocking": false
    }
  ],
  "release_posture": {
    "recommended_state": "Pilot Ready",
    "confidence_percent": 62,
    "blocking_decisions": []
  },
  "conflicts_resolved": [],
  "advisory_only": true,
  "governance_ref": ["ADR-0007", "ADR-0002"]
}
```

| Derived artifact | Consumer |
|------------------|----------|
| `run_plan.json` | Core → adapters (Planner materializes RUN/DEFER) |
| `skip_manifest.json` | QA reports (SKIP with reasons) |
| Council brief inputs | Executive Reporting |

---

## 7. Interfaces

| Interface | Direction | Contract |
|-----------|-----------|----------|
| Core `plan` phase | Out | `decision_bundle` + `run_plan` |
| REL aggregation | Out | `release_posture` |
| Reasoning Model | In | `reasoning_trace[]` |
| State Machine | Bidirectional | State transitions on decision commit |
| Feedback Model | Out | Decision IDs for outcome tracking |

---

## 8. Conflict Resolution

When engines disagree (e.g., low risk score but high regression likelihood):

1. Elevate to `INVESTIGATE` if delta > 0.4 on normalized scores  
2. Prefer **worst-case** for RT-Critical modules  
3. Emit `conflicts_resolved[]` with chosen path and rationale  
4. Never silently average to a SKIP on security or finance paths  

---

## 9. Future Extensions

- Decision replay: reproduce bundle from frozen inputs (audit)
- Policy DSL for steward-defined BLOCK rules
- Decision diff across runs for executive trend lines
- Human override layer (council marks `accepted_override` without deleting trace)

---

## 10. Open Questions

| ID | Question |
|----|----------|
| Q1 | Single decision bundle per run or per module parallel bundles? |
| Q2 | Should BLOCK decisions auto-create P0 finding stubs for REL? |
| Q3 | INVESTIGATE SLA — how long before auto-escalate to BLOCK? |

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-03 | Stage 2A decision engine |
