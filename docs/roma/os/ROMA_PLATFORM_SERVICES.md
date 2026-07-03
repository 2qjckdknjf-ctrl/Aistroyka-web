# ROMA Platform Services

**Document ID:** ROMA-OS-SVC-001  
**Version:** 1.0  
**Date:** 2026-07-03  
**Status:** Stage 2C (design only)  
**Parent:** `ROMA_OS_ARCHITECTURE.md`, `ROMA_KERNEL.md`

---

## 1. Purpose

Defines **shared platform services** between Kernel and Applications. Services encapsulate Stage 2/2A/2B intelligence and Stage 0–1 governance as reusable OS capabilities.

---

## 2. Service Catalog

### Registry Service

| Attribute | Value |
|-----------|-------|
| **Responsibility** | Applications, adapters, capabilities, RT-Critical modules, subsystem manifests |
| **Inputs** | Manifests, registry YAML, inventory snapshots |
| **Outputs** | Resolved registry views, `registry_ref` hashes |
| **Interfaces** | `IK-REGISTER-APP`, `IK-REGISTER-ADAPTER`, Stage 1 `subsystems.yaml` |
| **Owner** | Platform architecture |
| **Failure** | NACK registration; run cannot plan without minimum registry |

---

### Evidence Service

| Attribute | Value |
|-----------|-------|
| **Responsibility** | Store, index, redact, link evidence to findings |
| **Inputs** | Evidence Adapter payloads, `run_id` |
| **Outputs** | `evidence_index.json`, artifact paths under `docs/qa/runs/` |
| **Interfaces** | `IK-EVIDENCE-INGEST`, `evidence_bundle.schema.md` |
| **Owner** | QA platform / Core |
| **Failure** | Missing stamp → UNKNOWN; E-01 violations block confidence |

---

### Memory Service

| Attribute | Value |
|-----------|-------|
| **Responsibility** | Long-term engineering memory (MEM-*) |
| **Inputs** | Learning deltas, feedback events |
| **Outputs** | `memory_recall()`, recommendations |
| **Interfaces** | `IF-COG-MEMORY`, `knowledge_update.schema.md` |
| **Owner** | Learning steward |
| **Failure** | Degraded recall → heuristic-only risk (no secrets fallback) |

---

### Knowledge Service

| Attribute | Value |
|-----------|-------|
| **Responsibility** | Graph storage, impact_radius, architecture health |
| **Inputs** | Project Adapter inventory, run deltas |
| **Outputs** | `impact_radius`, `knowledge_delta.json`, G-001 violations |
| **Interfaces** | `IF-COG-KNOWLEDGE`, `ROMA_KNOWLEDGE_MODEL.md` |
| **Owner** | Architecture steward |
| **Failure** | Graph unavailable → diff-only regression mode |

---

### Decision Service

| Attribute | Value |
|-----------|-------|
| **Responsibility** | Reasoning traces + decision bundles |
| **Inputs** | Engine outputs, policy flags |
| **Outputs** | `reasoning_trace`, `decision_bundle` |
| **Interfaces** | `IF-COG-REASON`, `IF-COG-DECIDE` |
| **Owner** | Intelligence architecture |
| **Failure** | Invalid trace → `INVESTIGATE`; partial bundle rejected |

---

### Risk Service

| Attribute | Value |
|-----------|-------|
| **Responsibility** | Risk manifests, tier assignment |
| **Inputs** | Change set, memory, registry, knowledge |
| **Outputs** | `risk_manifest.json` |
| **Interfaces** | `IF-ENG-RISK`, `risk_manifest.schema.md` |
| **Owner** | QA + Security stewards |
| **Failure** | Empty manifest → S3 partial; confidence cap |

---

### Planning Service

| Attribute | Value |
|-----------|-------|
| **Responsibility** | Run plans, skip/defer manifests, priority order |
| **Inputs** | Risk, regression, coverage, decisions, budget |
| **Outputs** | `run_plan.json` |
| **Interfaces** | `IF-ENG-PLAN`, `IF-ENG-PRIORITY`, `run_plan.schema.md` |
| **Owner** | QA platform |
| **Failure** | Invalid plan → kernel abort execute |

---

### Reporting Service

| Attribute | Value |
|-----------|-------|
| **Responsibility** | RPT-* reports, council brief inputs |
| **Inputs** | All run artifacts, audience profile |
| **Outputs** | Markdown + `reports_index.json` |
| **Interfaces** | `IF-ENG-RPT` |
| **Owner** | Release council |
| **Failure** | Incomplete refs → report flagged partial |

---

### Release Service

| Attribute | Value |
|-----------|-------|
| **Responsibility** | Confidence, gates, RELEASE_VERDICT |
| **Inputs** | Domain board, PQS, decision bundle, pilot intake |
| **Outputs** | `release_confidence.json`, `RELEASE_VERDICT.json` |
| **Interfaces** | `IF-COG-RELEASE`, `IF-CORE-BLOCK`, ADR-0002 |
| **Owner** | Release council |
| **Failure** | UNKNOWN gates → Insufficient Evidence state |

---

### Compatibility Service

| Attribute | Value |
|-----------|-------|
| **Responsibility** | Schema, adapter, app version enforcement |
| **Inputs** | Manifests, `ROMA_COMPATIBILITY_POLICY.md` |
| **Outputs** | ACK/NACK, deprecation warnings |
| **Interfaces** | Kernel K9, K10 |
| **Owner** | Platform architecture |
| **Failure** | NACK blocks registration; warn on deprecated |

---

### Policy Service

| Attribute | Value |
|-----------|-------|
| **Responsibility** | ADR rules, blocking matrix, finance G-001 |
| **Inputs** | Project Adapter policy flags, findings |
| **Outputs** | `blocking_gates[]`, policy violations |
| **Interfaces** | `IK-POLICY-CHECK`, ADR-0001–0009 |
| **Owner** | Security + release council |
| **Failure** | Fail-closed: unknown policy → BLOCK recommendation |

---

## 3. Service Dependency Graph

```
Registry → Risk → Planning → (Apps/Adapters execute) → Evidence
                ↓                              ↓
            Decision ← Knowledge ← Memory ← Feedback
                ↓
         Release → Reporting
                ↑
         Policy, Compatibility (cross-cutting)
```

---

## 4. Mapping from Stage 0–2B

| Legacy name | Platform Service |
|-------------|------------------|
| ROMA Core registry | Registry Service |
| ROMA Intelligence engines | Risk, Planning, Decision (+ Release) |
| ROMA Learning | Memory Service |
| ROMA Knowledge Graph | Knowledge Service |
| ROMA Release | Release Service |
| ROMA Reporting | Reporting Service |
| PQS | Release Service (with QA app input) |

---

## 5. Future Extensions

- Service-level SLOs and health endpoints  
- Optional external Memory/Knowledge backends  
- Policy Service rule DSL  
- Cross-app Reporting correlation

---

## 6. Open Questions

| ID | Question |
|----|----------|
| Q1 | One Planning Service per app or shared queue? |
| Q2 | Policy Service centralized vs per-app overlays? |
| Q3 | Compatibility Service in CI for manifest PRs? |

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-03 | Initial platform services catalog |
