# ROMA Intelligence — System Overview

**Document ID:** ROMA-INT-000  
**Version:** 1.0  
**Date:** 2026-07-03  
**Status:** Stage 2 Architecture (design only)  
**Parent:** `ROMA_CORE_SPEC.md`  
**Location:** `docs/roma/intelligence/`

---

## 1. Purpose

**ROMA Intelligence** is the decision brain of the QA framework. It sits between **ROMA Core** (orchestration) and **subsystem adapters** (WEB, BCK, IOS, …). It answers *what*, *why*, *how deep*, and *whether release is safe* — without executing tests or modifying product code.

Intelligence is **recommendation-only**. It produces plans, scores, and reports. ROMA Core executes approved plans. ROMA Learning ingests outcomes. No automatic production changes.

---

## 2. Vision

Transform QA from static suites into a **context-aware decision engine** that:

- Adapts depth to risk and change blast radius  
- Minimizes redundant execution while preserving safety  
- Surfaces release confidence with evidence-backed reasoning  
- Learns from history without hiding regressions  
- Speaks to developers, security, AI ops, and executives in tailored reports  

---

## 3. Position in ROMA Stack

```
┌─────────────────────────────────────────┐
│           ROMA Intelligence             │
│  Risk · Planner · Regression · Coverage │
│  Learning · Confidence · Reporting      │
│  Knowledge Graph · Decision Pipeline    │
└─────────────────┬───────────────────────┘
                  │ run_plan, risk_manifest
                  ▼
┌─────────────────────────────────────────┐
│              ROMA Core                  │
│  Orchestration · Registry · Artifacts   │
└─────────────────┬───────────────────────┘
                  │ subsystem manifests
                  ▼
┌─────────────────────────────────────────┐
│         Subsystem Adapters              │
│  WEB · BCK · IOS · AND · AI · SEC · …   │
└─────────────────────────────────────────┘
```

*Rationale:* Separates **judgment** from **execution** — intelligence can evolve without rewriting Playwright/XCTest layers.

---

## 4. Intelligence Engines (Index)

| Engine | Document | Primary question |
|--------|----------|------------------|
| Risk | `ROMA_RISK_ENGINE.md` | How risky is each module? |
| Planner | `ROMA_PLANNER_ENGINE.md` | What should run, at what tier? |
| Regression | `ROMA_REGRESSION_ENGINE.md` | What will likely break? |
| Coverage | `ROMA_COVERAGE_ENGINE.md` | What is uncovered (beyond %)? |
| Learning | `ROMA_LEARNING_ENGINE.md` | What patterns repeat? |
| Release Confidence | `ROMA_RELEASE_CONFIDENCE_ENGINE.md` | Is release safe? How confident? |
| Executive Reporting | `ROMA_EXECUTIVE_REPORTING_ENGINE.md` | Who needs what narrative? |
| Knowledge Graph | `ROMA_KNOWLEDGE_GRAPH.md` | What depends on what? |
| Decision Pipeline | `ROMA_DECISION_PIPELINE.md` | End-to-end flow |
| Evidence | `ROMA_EVIDENCE_MODEL.md` | What proof is required? |
| Scoring | `ROMA_SCORING_MODEL.md` | How are scores composed? |
| Priority | `ROMA_PRIORITY_ENGINE.md` | What runs first under budget? |

---

## 5. Core Questions Answered

| Question | Engine(s) |
|----------|-----------|
| What should be tested? | Planner, Coverage, Knowledge Graph |
| Why should it be tested? | Risk, Regression, Learning |
| How deeply should it be tested? | Risk → tier recommendation |
| Which risks are highest? | Risk, Priority |
| Which tests may be skipped? | Planner (with documented reason → UNKNOWN) |
| Is the release safe? | Release Confidence, Risk (R0) |
| How confident is the release? | Release Confidence % |
| What changed vs previous runs? | Regression, Learning, Coverage delta |
| Which modules are unstable? | Learning, Regression |
| Which modules lack coverage? | Coverage |
| Which failures repeat? | Learning |
| Which failures are new? | Learning + Regression |

---

## 6. Interfaces with Stage 0/1

| Artifact | Relationship |
|----------|--------------|
| PQS (`ADR-0001`) | Release Confidence consumes PQS; does not replace it |
| PR blocking (`ADR-0002`) | Intelligence recommends; policy enforces |
| Credential profiles (`ADR-0003`) | Planner marks slices UNKNOWN when missing |
| `ROMA_CORE_SPEC` | Core delegates `plan` phase to Intelligence |
| `ROMA_SUBSYSTEMS` | Each module registers graph nodes + risk factors |
| `docs/qa/` (`ADR-0006`) | Intelligence reads/writes run artifacts only |

---

## 7. Non-Goals (Stage 2)

- No Playwright, mobile, or backend test implementation  
- No ML model training pipelines (heuristic + graph first)  
- No auto-fix or auto-commit to product repos  
- No production mutation  

---

## 8. Future Extensibility

- Plug-in risk factors per subsystem steward  
- Optional ML overlay on Regression engine (versioned, council-gated)  
- Real-time intelligence on PR diff (Stage 3+ implementation)  
- Federation with external SIEM / error trackers via OBS  

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-03 | Initial intelligence overview |
