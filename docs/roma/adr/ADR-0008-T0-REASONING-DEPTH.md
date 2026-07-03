# ADR-0008: T0 Reasoning Depth

**Status:** Accepted  
**Date:** 2026-07-03  
**Deciders:** ROMA architecture  
**Supersedes:** —  
**Related:** `ROMA_REASONING_MODEL.md`, `reasoning_trace.schema.md`, `ROMA_STATE_MACHINE.md`

---

## Context

Stage 2A defined nine mandatory reasoning questions for every ROMA decision. T0 smokes must complete in ≤10 minutes. Full reasoning on every T0 slice risks blocking deploy velocity without proportional safety gain.

Stage 2B requires an explicit policy for abbreviated vs full reasoning and schema enforcement (`reasoning_mode`).

---

## Decision

### 1. T0 may use abbreviated reasoning

When **all** of the following hold:

- Tier is `T0` only (not T1+ tail on same run unless re-scored)
- Trigger is `pr` post-deploy tail or `deploy` smoke (not `council`)
- No open R0 signals in change_set heuristics
- Decision unit is not a release-level `decision_unit: release`

T0 traces may set `reasoning_mode: abbreviated_t0` and record **eight abbreviated fields** per `reasoning_trace.schema.md`:

| Abbreviated field | Full question equivalent |
|-------------------|-------------------------|
| `change_summary` | Q1 What changed? |
| `materiality` | Q2 Why does it matter? |
| `affected_area` | Q3 Who is affected? (surfaces/roles shorthand) |
| `risk_tier` | Q4+Q5 shorthand (RT-* from registry + risk_manifest) |
| `evidence_present` | Q6 |
| `evidence_gaps` | Q7 |
| `recommendation` | Q8 |
| `recommendation_confidence` | Q9 |

Omitted in T0 abbreviated mode: explicit `failure_probability` and full `impact` object. Values are **inferred** from `risk_tier` and RT-Critical registry — must cite `registry_ref` in trace metadata or `governance_ref`.

### 2. Full nine-question reasoning is mandatory for

| Condition | `reasoning_mode` |
|-----------|------------------|
| Tier T1, T2, T3 | `full` |
| Any P0 or P1 finding under review | `full` |
| Release decisions (`decision_unit: release`) | `full` |
| Changes touching AI routes or AI subsystem inventory | `full` |
| Changes touching security catalog (SEC) or RBAC matrix | `full` |
| Changes touching tenant isolation probes or RLS migrations | `full` |
| Council trigger (`trigger: council`) | `full` |
| Any module with `risk_class: R0` or `R1` in risk_manifest | `full` |
| Hotfix to production promotion path | `full` |

### 3. Schema enforcement

- `reasoning_trace.schema.md` rules RT-V02 (full) and RT-V03 (abbreviated) are normative.
- T0 abbreviated traces on non-T0 paths → **reject artifact**; Decision Engine emits `INVESTIGATE`.
- Abbreviated traces must still include non-empty `rationale_summary`.

### 4. Confidence caps

Abbreviated T0 traces apply an additional **−5%** confidence cap vs full traces for the same module (stacking with other caps in `ROMA_REASONING_MODEL.md`).

---

## Consequences

- T0 deploy smokes stay fast while preserving audit minimums.
- Stage 3 Core validator must check `reasoning_mode` vs `tier` + `trigger`.
- Executive reports label T0 abbreviated reasoning explicitly.
- Stage 2B fixtures for T0 should include one abbreviated example (optional follow-up).

---

## Compliance

- Producers: Intelligence orchestrator, Reasoning Model
- Consumers: Decision Engine, Core collect validator (Stage 3)
- Council may promote stricter policy (full reasoning on all tiers) via ADR amendment

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-03 | Initial T0 depth decision |
