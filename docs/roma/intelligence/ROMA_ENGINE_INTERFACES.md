# ROMA Engine Interfaces

**Document ID:** ROMA-INT-CORE-009  
**Version:** 1.0  
**Date:** 2026-07-03  
**Status:** Stage 2A Architecture (design only)  
**Parent:** `ROMA_INTELLIGENCE_CORE.md`

---

## 1. Purpose

Defines **contracts between cognitive models (Stage 2A) and computational engines (Stage 2)** plus Core and adapters — ensuring every subsystem speaks the same intelligence language.

---

## 2. Responsibilities

| Owns | Does not own |
|------|--------------|
| Interface IDs and versioning | Engine internal algorithms |
| Request/response schemas (conceptual) | JSON Schema files (Stage 2B) |
| Compatibility and deprecation rules | HTTP transport choice |

---

## 3. Interface Map

```
                    ┌─────────────────────┐
                    │ Intelligence Core   │
                    │ (Stage 2A models)   │
                    └──────────┬──────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         ▼                     ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  IF-COG-REASON  │  │  IF-COG-DECIDE  │  │  IF-COG-MEMORY  │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                   Stage 2 Engines                            │
│  IF-ENG-RISK │ IF-ENG-PLAN │ IF-ENG-REGRESS │ IF-ENG-COV   │
│  IF-ENG-LEARN │ IF-ENG-CONF │ IF-ENG-PRIORITY │ IF-ENG-RPT │
└────────────────────────────┬────────────────────────────────┘
                             ▼
                    ┌─────────────────┐
                    │  IF-CORE-PLAN   │
                    │  IF-CORE-COLLECT│
                    └────────┬────────┘
                             ▼
                    ┌─────────────────┐
                    │ Subsystem       │
                    │ IF-ADAPTER-*    │
                    └─────────────────┘
```

---

## 4. Cognitive Interfaces (Stage 2A)

| ID | Method | Input | Output |
|----|--------|-------|--------|
| **IF-COG-REASON** | `reason(unit, context)` | change_set, knowledge, memory | `reasoning_trace` |
| **IF-COG-DECIDE** | `decide(traces, engine_outputs)` | traces + manifests | `decision_bundle` |
| **IF-COG-MEMORY** | `recall(query)` / `commit(delta)` | category, subject_ref | facts, recommendations |
| **IF-COG-KNOWLEDGE** | `impact_radius(nodes)` / `health()` | change_set | nodes, edges, violations |
| **IF-COG-FEEDBACK** | `evaluate(prediction, outcome)` | refs | feedback_event |
| **IF-COG-RELEASE** | `assess_posture(bundle, verdicts)` | domain board, PQS | release_posture |

---

## 5. Engine Interfaces (Stage 2)

| ID | Engine | Input | Output |
|----|--------|-------|--------|
| **IF-ENG-RISK** | Risk | change_set, memory, knowledge | `risk_manifest.json` |
| **IF-ENG-PLAN** | Planner | risk, regress, coverage, decisions | `run_plan.json` |
| **IF-ENG-REGRESS** | Regression | diff, graph, memory | `regression_forecast.json` |
| **IF-ENG-COV** | Coverage | graph, manifests, prior map | `coverage_map.json` |
| **IF-ENG-LEARN** | Learning | findings, feedback | `learning_delta.json` |
| **IF-ENG-CONF** | Release Confidence | verdicts, debt, feedback | `release_confidence.json` |
| **IF-ENG-PRIORITY** | Priority | plan candidates, budget | ordered plan |
| **IF-ENG-RPT** | Executive Reporting | all artifacts | `RPT-*.md` |

Engines **must** accept cognitive context objects; they **must not** bypass Reasoning Model for release-blocking recommendations.

---

## 6. Core Interfaces

| ID | Direction | Payload |
|----|-----------|---------|
| **IF-CORE-PLAN** | Intelligence → Core | `decision_bundle`, `run_plan.json` |
| **IF-CORE-EXECUTE** | Core → Adapters | tier, profiles, slice IDs |
| **IF-CORE-COLLECT** | Adapters → Core | artifacts, raw findings |
| **IF-CORE-VERDICT** | Core → Intelligence | normalized findings, domain board |
| **IF-CORE-BLOCK** | Core → REL | ADR-0002 applied gates |

---

## 7. Adapter Interfaces (Stage 3+)

| ID | Subsystem | Operations |
|----|-----------|------------|
| **IF-ADAPTER-WEB** | WEB | plan, execute, collect, verdict |
| **IF-ADAPTER-BCK** | BCK | contract probe, latency, error taxonomy |
| **IF-ADAPTER-SEC** | SEC | denylist, exposure, headers |
| **IF-ADAPTER-AI** | AI | LIVE/FALLBACK, leakage |
| **IF-ADAPTER-IOS** | IOS | UITest, Layer B |
| **IF-ADAPTER-AND** | AND | instrumented, API chain |

All adapters emit findings compatible with `ROMA_EVIDENCE_MODEL.md`.

---

## 8. Versioning

| Field | Rule |
|-------|------|
| `cognitive_contract_version` | `cog_v1` — bump on breaking reasoning schema |
| `engine_contract_version` | Per engine in registry |
| Deprecation | 2-stage: parallel support → remove with ADR |

---

## 9. Future Extensions

- gRPC/JSON-RPC service boundaries for distributed intelligence
- OpenAPI-style published schemas in `docs/roma/schemas/`
- Contract conformance tests (Stage 2B)
- Adapter SDK code generators from interface defs

---

## 10. Open Questions

| ID | Question |
|----|----------|
| Q1 | Monolithic intelligence library vs microservices per engine? |
| Q2 | Synchronous pipeline vs event bus between interfaces? |
| Q3 | Required fields strictness — JSON Schema `additionalProperties: false`? |

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-03 | Stage 2A engine interfaces |
