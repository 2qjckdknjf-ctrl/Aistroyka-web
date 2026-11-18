# ADR-0007: ROMA Intelligence Layer — Recommendation-Only

**Status:** Accepted  
**Date:** 2026-07-03  
**Deciders:** ROMA architecture  
**Supersedes:** —  
**Related:** `ROMA_INTELLIGENCE.md`, `ROMA_LEARNING_ENGINE.md`, `ROMA_CORE_SPEC.md`

---

## Context

Stage 2 defines ROMA Intelligence as the decision brain (risk, planning, regression, coverage, confidence, reporting). Without an explicit boundary, intelligence outputs could be misinterpreted as autonomous actions.

## Decision

1. **ROMA Intelligence is recommendation-only.** It produces plans, scores, forecasts, and reports. It does not execute tests, deploy code, or mutate product repositories.
2. **ROMA Core** remains the execution authority: it consumes `run_plan.json`, invokes subsystem adapters, and applies ADR-0002 blocking policy.
3. **ROMA Learning** stores patterns and recommendations only — no auto-remediation of production code.
4. Intelligence outputs are **advisory** until aggregated by ROMA Release per ADR-0002 (e.g., PR T1 comment, council brief).
5. Canonical intelligence specs live under `docs/roma/intelligence/`.

## Consequences

- Stage 3+ adapter implementation must consume Intelligence `run_plan` contracts, not duplicate planning logic in adapters.
- CI may surface Intelligence recommendations without treating them as merge gates unless ADR-0002 explicitly promotes a gate.
- Future automation (Stage 7) may auto-block on R0 only — not on intelligence confidence alone without council policy.

## Compliance

- Every intelligence engine doc must state "recommendation-only" in responsibilities.
- `ROMA_LEARNING_ENGINE.md` must not describe code auto-fix paths.
