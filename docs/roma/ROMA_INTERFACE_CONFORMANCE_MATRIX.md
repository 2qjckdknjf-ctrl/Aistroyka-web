# ROMA Interface Conformance Matrix

**Document ID:** ROMA-IFM-001  
**Version:** 1.0  
**Date:** 2026-07-03  
**Status:** Stage 2B (contract governance)  
**Parent:** `intelligence/ROMA_ENGINE_INTERFACES.md`  
**Schemas:** `docs/roma/schemas/*.schema.md`

---

## 1. Purpose

Maps every `IF-*` interface from Stage 2A to canonical schemas, validation ownership, and failure modes — enabling Stage 3 adapters to consume contracts safely.

---

## 2. Cognitive interfaces

| Interface | Method | Schema | Required fields (output) | Producer | Consumer | Validator | Failure mode | Blocking |
|-----------|--------|--------|------------------------|----------|----------|-----------|--------------|----------|
| **IF-COG-REASON** | `reason()` | `reasoning_trace.schema.md` | `decision_id`, `questions`, `reasoning_mode`, `rationale_summary` | Intelligence orchestrator | Decision Engine, Reporting | Core collect (Stage 3) | Invalid trace → `INVESTIGATE` | No — caps confidence |
| **IF-COG-DECIDE** | `decide()` | `decision_bundle.schema.md` | `decisions[]`, `release_posture`, `advisory_only` | Decision Engine | Core `IF-CORE-PLAN`, REL | Core plan gate | Reject plan → `SX_ERROR` | BLOCK decisions → REL advisory |
| **IF-COG-MEMORY** | `recall()` / `commit()` | `knowledge_update.schema.md` (writes) | `memory_writes[]` on commit | Learning + Feedback | Risk, Regression, Reasoning | Memory steward (manual v0) | Stale recall → heuristic only | No |
| **IF-COG-KNOWLEDGE** | `impact_radius()` / `health()` | `knowledge_update.schema.md` (delta) | `graph_delta`, `violations` | Inventory sync + Knowledge | Reasoning, Risk, Regression | Graph validator | Missing graph → diff-only mode | G-001 violation → BLOCK rec |
| **IF-COG-FEEDBACK** | `evaluate()` | `knowledge_update.schema.md` (`feedback_events`) | `feedback_id`, `match` | Feedback Model | Memory, Calibration | QA steward review | False negative → steward ticket | No — escalates review |
| **IF-COG-RELEASE** | `assess_posture()` | `release_confidence.schema.md` | `confidence_percent`, `state`, `gates[]` | Release Confidence Engine | Decision bundle, REL | REL aggregation | UNKNOWN gates → `Insufficient Evidence` | Per ADR-0002 |

---

## 3. Engine interfaces

| Interface | Schema | Required fields | Producer | Consumer | Validator | Failure mode | Blocking |
|-----------|--------|-----------------|----------|----------|-----------|--------------|----------|
| **IF-ENG-RISK** | `risk_manifest.schema.md` | `modules[]`, `registry_ref` | Risk Engine | Planner, Reasoning, Decision | Core pre-plan | Empty manifest → partial S3 | RT-Critical omit → UNKNOWN |
| **IF-ENG-PLAN** | `run_plan.schema.md` | `tests_to_run[]`, `bundle_ref` | Planner + Priority | Core execute | Core `IF-CORE-PLAN` | Invalid → no execute | Missing RT-Critical run → cap |
| **IF-ENG-REGRESS** | *(forecast embedded in risk/reasoning)* | `regression_forecast.json`¹ | Regression Engine | Reasoning Q4, Planner | Engine self-check | Fallback direct-diff | No |
| **IF-ENG-COV** | `coverage_snapshot.schema.md` | `dimensions`, `debt_register` | Coverage Engine | Planner, Release Confidence | Coverage validator | Missing dimension → UNKNOWN | Debt on finance → RUN rec |
| **IF-ENG-LEARN** | `knowledge_update.schema.md` | `memory_writes` | Learning Engine | Memory Model | LRN steward | Partial write → warning | No |
| **IF-ENG-CONF** | `release_confidence.schema.md` | `state`, `components` | Release Confidence | Decision, REL, RPT-EXEC | REL | Component gap → 0 score | R0 gate fail → Blocked |
| **IF-ENG-PRIORITY** | `run_plan.schema.md` (`order` fields) | `tests_to_run[].order` | Priority Engine | Planner output | Planner | Budget defer → `tests_deferred` | Deferred AI LIVE → cap |
| **IF-ENG-RPT** | *(markdown)* + refs to all schemas | `reports_index.json`¹ | Executive Reporting | Humans, council | Manual | Missing ref → incomplete report | No |

¹ Stage 2B defers standalone schema docs; fields embedded in conformance matrix until Stage 2C if needed.

---

## 4. Core interfaces

| Interface | Direction | Schema(s) | Required fields | Producer | Consumer | Validator | Failure mode | Blocking |
|-----------|-----------|-----------|-----------------|----------|----------|-----------|--------------|----------|
| **IF-CORE-PLAN** | Intel → Core | `decision_bundle`, `run_plan` | `plan_id`, `tests_to_run`, `advisory_only` on bundle | Intelligence | Core scheduler | Core schema gate | Abort run | Per ADR-0002 at REL |
| **IF-CORE-EXECUTE** | Core → Adapters | `run_plan` slices | `slice_id`, `subsystem`, profiles | Core | WEB/BCK/SEC/… | Adapter manifest | Slice fail → finding | Subsystem UNKNOWN |
| **IF-CORE-COLLECT** | Adapters → Core | `evidence_bundle` | `build_stamp`, `artifacts[]` | Adapters + Core | Intelligence S5+ | EB-V01–V05 | Missing stamp → UNKNOWN | OBS gate |
| **IF-CORE-VERDICT** | Core → Intel | DOMAIN_VERDICT_BOARD¹ | domain verdicts YES/NO/UNKNOWN | Core | Confidence, Reasoning | Core spec | Invalid → UNKNOWN | REL blocking |
| **IF-CORE-BLOCK** | Core → REL | ADR-0002 matrix | `blocking_gates[]` | REL | Council | Council | NO-GO | **Yes** |

---

## 5. Adapter interfaces (Stage 3 — contract preview)

| Interface | Schema output | Evidence types | Validator | Failure mode | Blocking |
|-----------|---------------|----------------|-----------|--------------|----------|
| **IF-ADAPTER-WEB** | findings + `EV-SCREEN`, `EV-TRACE` | WEB slices | Core collect | Flake → MEM-FLAKE | Advisory T1 |
| **IF-ADAPTER-BCK** | findings + `EV-NET`, `EV-API` | BCK contracts | Core collect | 5xx spike → P1 rec | T0 staging |
| **IF-ADAPTER-SEC** | findings + `EV-API`, `EV-NET` | SEC catalog | Core + steward | R0 → BLOCK | **Yes** R0 |
| **IF-ADAPTER-AI** | findings + `EV-LOG` | AI probes | AI steward | FALLBACK → UNKNOWN | Conditional |
| **IF-ADAPTER-IOS** | findings + `EV-MOBILE` | UITest XML | Core collect | UNKNOWN default P3 | Conditional |
| **IF-ADAPTER-AND** | findings + `EV-MOBILE` | Instrumented | Core collect | UNKNOWN default P3 | Conditional |

---

## 6. Validation responsibility matrix

| Stage | Who validates | What |
|-------|---------------|------|
| 2B (now) | Documentation + manual fixture review | Schema completeness, matrix coverage |
| 3 | Core plan gate | `decision_bundle`, `run_plan` before execute |
| 3 | Core collect gate | `evidence_bundle` after run |
| 3 | REL | `release_confidence` + ADR-0002 |
| 2C (future) | Automated schema CI | JSON fixtures against machine schemas |

---

## 7. Cross-schema dependencies

```
change_set → risk_manifest → run_plan
                ↓              ↓
         reasoning_trace → decision_bundle
                ↓              ↓
         evidence_bundle → release_confidence
                ↓
         knowledge_update (S7)
         state_snapshot (lifecycle)
         coverage_snapshot (parallel)
```

---

## 8. Coverage checklist

| IF-* ID | Mapped | Schema doc |
|---------|--------|------------|
| IF-COG-REASON | ✅ | reasoning_trace |
| IF-COG-DECIDE | ✅ | decision_bundle |
| IF-COG-MEMORY | ✅ | knowledge_update |
| IF-COG-KNOWLEDGE | ✅ | knowledge_update |
| IF-COG-FEEDBACK | ✅ | knowledge_update |
| IF-COG-RELEASE | ✅ | release_confidence |
| IF-ENG-RISK | ✅ | risk_manifest |
| IF-ENG-PLAN | ✅ | run_plan |
| IF-ENG-REGRESS | ✅ | matrix ref¹ |
| IF-ENG-COV | ✅ | coverage_snapshot |
| IF-ENG-LEARN | ✅ | knowledge_update |
| IF-ENG-CONF | ✅ | release_confidence |
| IF-ENG-PRIORITY | ✅ | run_plan |
| IF-ENG-RPT | ✅ | matrix ref¹ |
| IF-CORE-PLAN | ✅ | decision_bundle + run_plan |
| IF-CORE-EXECUTE | ✅ | run_plan |
| IF-CORE-COLLECT | ✅ | evidence_bundle |
| IF-CORE-VERDICT | ✅ | matrix ref¹ |
| IF-CORE-BLOCK | ✅ | ADR-0002 |
| IF-ADAPTER-WEB | ✅ | evidence_bundle |
| IF-ADAPTER-BCK | ✅ | evidence_bundle |
| IF-ADAPTER-SEC | ✅ | evidence_bundle |
| IF-ADAPTER-AI | ✅ | evidence_bundle |
| IF-ADAPTER-IOS | ✅ | evidence_bundle |
| IF-ADAPTER-AND | ✅ | evidence_bundle |

**All 25 IF-* interfaces mapped.**

---

## 9. Open questions

| ID | Question | Target |
|----|----------|--------|
| Q1 | Standalone `regression_forecast.schema.md` in 2C? | Stage 2C |
| Q2 | Machine JSON Schema files alongside `.schema.md`? | Stage 2C |
| Q3 | Adapter SDK generated from this matrix? | Stage 3 |

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-03 | Initial conformance matrix |
