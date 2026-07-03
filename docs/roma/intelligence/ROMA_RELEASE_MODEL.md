# ROMA Release Model

**Document ID:** ROMA-INT-CORE-006  
**Version:** 1.0  
**Date:** 2026-07-03  
**Status:** Stage 2A Architecture (design only)  
**Parent:** `ROMA_INTELLIGENCE_CORE.md`  
**Implements:** `ROMA_RELEASE_CONFIDENCE_ENGINE.md` (Stage 2 computation)

---

## 1. Purpose

Defines how ROMA reasons about **release readiness** — the conceptual model for pilot, production, blocked, and insufficient-evidence states independent of council politics.

Release reasoning synthesizes quality, risk, coverage, regression prediction, and historical stability into engineering confidence.

---

## 2. Responsibilities

| Owns | Does not own |
|------|--------------|
| Release readiness states and transitions | Deploy button / CI merge |
| Confidence composition semantics | PQS weights (ADR-0001) |
| Gate taxonomy (hard vs conditional vs advisory) | Store upload (MODE B) |
| Release unit definition (SHA, scope, tier) | Stripe billing cutover |

---

## 3. Release Readiness States

| State | Meaning | Typical gates |
|-------|---------|---------------|
| **Production Ready** | Council may GO to production | Confidence ≥75, R0=0, P0=0, PQS≥70 |
| **Pilot Ready** | Safe for controlled pilot exposure | Confidence ≥55, R0=0, intake READY if real client |
| **Blocked** | Do not ship | R0, Confidence <40, explicit NO on RT-Critical |
| **Insufficient Evidence** | Cannot judge | >3 required UNKNOWN domains |
| **Conditional** | Ship with documented waivers | Council-approved P1 waivers |

States are **recommendations**; REL + council apply ADR-0002.

---

## 4. Confidence Composition (Conceptual)

```
Release Confidence =
  f(functional_quality,
    backend_reliability,
    security_rbac_tenant,
    ai_readiness,
    performance,
    accessibility,
    coverage_completeness,
    regression_prediction_accuracy,
    historical_stability,
    pqs_correlation)
```

Each component maps to reasoning traces and domain verdicts. Missing evidence applies fail-closed caps per `ROMA_REASONING_MODEL.md`.

---

## 5. Release Gates

| Gate | Type | Source |
|------|------|--------|
| R0 count = 0 | Hard | Risk Model + SEC |
| T0 staging green | Hard | Core T0 |
| PQS ≥ threshold | Hard | ADR-0001 |
| AI LIVE when AI touched | Conditional | AI adapter |
| Pilot intake READY | Conditional (real client) | `docs/launch/` |
| Finance isolation probe | Hard (prod path) | SEC stakeholder profile |
| Mobile store readiness | Conditional | IOS/AND (owner-gated) |
| Chaos suite | Advisory → hard (major release) | CHS |

---

## 6. Inputs

| Input | Source |
|-------|--------|
| `decision_bundle` | Decision Engine |
| Domain verdict board | Core aggregation |
| PQS | ADR-0001 computation |
| `release_confidence` draft | Release Confidence Engine |
| Memory release history | Memory Model |
| Trigger context | pilot / patch / major / hotfix |
| Pilot intake status | `validate_pilot_intake.mjs` |

---

## 7. Outputs

| Output | Consumer |
|--------|----------|
| `release_posture` | Decision bundle, council brief |
| `release_reasoning_trace` | Executive RPT-EXEC |
| `gate_checklist.json` | REL, CI advisory bot |
| `confidence_delta` vs prior release | Memory MEM-RELEASE |

---

## 8. Interfaces

| Partner | Contract |
|---------|----------|
| Release Confidence Engine | Numeric % and state labels |
| Decision Engine | BLOCK decisions → Blocked state |
| Reasoning Model | Per-gate evidence gaps |
| Feedback Model | Calibrate confidence vs outcomes |
| ROMA Release subsystem | Final `RELEASE_VERDICT.json` |

---

## 9. Evolution Reasoning

Release model also answers **software evolution** questions:

| Question | Method |
|----------|--------|
| Is this release riskier than last? | `confidence_delta`, PQS delta, new RT-Critical exposure |
| What changed in quality posture? | Domain verdict diff, memory trends |
| Are we accumulating debt? | Coverage debt + MEM-QUALITY slope |

---

## 10. Future Extensions

- Release archetypes (pilot-day0, weekly-staging, GA) with preset gate sets
- Multi-artifact releases (web SHA + iOS build + Android build) unified posture
- Automatic council brief section generation from release reasoning trace
- Waivers registry with expiry and re-validation hooks

---

## 11. Open Questions

| ID | Question |
|----|----------|
| Q1 | Separate Pilot Ready vs Production Ready confidence floors per environment? |
| Q2 | How to unify web-only vs mobile-inclusive release units? |
| Q3 | Hotfix path — abbreviated reasoning with mandatory R0/SEC only? |

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-03 | Stage 2A release model |
