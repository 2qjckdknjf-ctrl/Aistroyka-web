# ROMA Application Model

**Document ID:** ROMA-OS-APP-001  
**Version:** 1.0  
**Date:** 2026-07-03  
**Status:** Stage 2C (design only)  
**Parent:** `ROMA_OS_ARCHITECTURE.md`

---

## 1. Purpose

Defines how **applications** plug into ROMA OS — lifecycle, SDK contract, and the first wave of planned apps. Applications consume Platform Services and Kernel interfaces; they do not replace the kernel.

---

## 2. Application Lifecycle

```
proposed → registered → enabled → executed → reported → deprecated → retired
```

| State | Meaning | Kernel action |
|-------|---------|---------------|
| **proposed** | Design/doc only; no manifest | None |
| **registered** | Manifest accepted; compatibility checked | `IK-REGISTER-APP` ACK |
| **enabled** | May be scheduled in runs | Exposed to Planning Service |
| **executed** | Active in a `run_id` | Lifecycle binding |
| **reported** | Findings/evidence emitted | Evidence + Reporting Services |
| **deprecated** | Still runnable; warnings | Compatibility Service warns |
| **retired** | Disabled; historical reads only | Reject new executions |

---

## 3. Application Manifest (SDK)

```yaml
app_id: roma-qa
app_version: "1.0"
contract_version: app_sdk_v1
purpose: Multi-surface quality assurance
capabilities: [plan_slices, collect_evidence, emit_findings, contribute_pqs]
kernel_interfaces:
  - IK-LIFECYCLE
  - IK-PLAN-REQUEST
  - IK-EVIDENCE-INGEST
inputs:
  - project_adapter_inventory
  - run_plan
  - credential_profile_refs
outputs:
  - findings.jsonl
  - subsystem_verdicts
  - coverage_snapshot
evidence_types: [EV-SCREEN, EV-TRACE, EV-NET, EV-MOBILE]
risks_reduced: [functional, regression, coverage_debt]
blocking_policy: advisory  # ADR-0002 enforced at REL
stewards: [platform-qa]
```

---

## 4. First Applications

### ROMA QA (registered — Stages 0–2B)

| Field | Value |
|-------|-------|
| **Purpose** | Unified assurance across web, mobile, API, DB, AI for release readiness |
| **Inputs** | Project inventory, `run_plan`, profiles, tier, environment |
| **Outputs** | Findings, domain verdicts, PQS inputs, coverage snapshot |
| **Capabilities** | Plan/execute/collect/verdict per Stage 1 subsystem model |
| **Evidence** | Screenshots, traces, HAR, mobile XML, build stamps |
| **Risks reduced** | Functional regression, coverage gaps, release unknowns |
| **Kernel interfaces** | `IK-LIFECYCLE`, `IK-PLAN-REQUEST`, `IK-EVIDENCE-INGEST` |
| **Blocking policy** | Advisory at T1; REL applies ADR-0002 |
| **Status** | **enabled** (first app; Stages 0–2B define behavior) |

---

### ROMA Security (proposed)

| Field | Value |
|-------|-------|
| **Purpose** | Threat-oriented probes: authZ, exposure, headers, finance denylist |
| **Inputs** | Sensitive endpoint catalog, stakeholder profiles, RBAC matrix |
| **Outputs** | R0–R4 findings, SEC domain verdict |
| **Capabilities** | Endpoint probe, denylist validation, tenant negative tests |
| **Evidence** | EV-API, EV-NET (redacted) |
| **Risks reduced** | R0/R1 security, finance leakage |
| **Kernel interfaces** | `IK-PLAN-REQUEST`, `IK-EVIDENCE-INGEST`, `IK-DECISION-EMIT` |
| **Blocking policy** | R0 blocks via Policy Service |

---

### ROMA AI Audit (proposed)

| Field | Value |
|-------|-------|
| **Purpose** | LIVE/FALLBACK governance, leakage, provider health |
| **Inputs** | AI catalog, require-live policy, tenant fixtures |
| **Outputs** | AI_READY verdict, classification artifacts |
| **Evidence** | EV-LOG (redacted), no raw prompts with secrets |
| **Risks reduced** | AI fallback in production, cross-tenant memory leak |
| **Blocking policy** | Conditional when AI paths touched |

---

### ROMA Performance (proposed)

| Field | Value |
|-------|-------|
| **Purpose** | Budgets, LCP/CLS, API SLOs |
| **Inputs** | Perf budgets, baseline runs |
| **Outputs** | PERFORMANCE_REPORT, regressions |
| **Evidence** | EV-LOG, Lighthouse output via Tool Adapter |
| **Risks reduced** | Perf regressions, SLO breach |

---

### ROMA Mobile (proposed)

| Field | Value |
|-------|-------|
| **Purpose** | iOS/Android audit, cross-surface scenarios |
| **Inputs** | Mobile screen map, UITest/instrumented slices |
| **Outputs** | MOBILE_IOS/AND verdicts |
| **Evidence** | EV-MOBILE |
| **Risks reduced** | Field worker/manager journey breaks |

---

### ROMA Architecture (proposed)

| Field | Value |
|-------|-------|
| **Purpose** | Graph health, boundary drift, ADR compliance |
| **Inputs** | Knowledge graph, inventory hash |
| **Outputs** | Architecture health score, violations |
| **Evidence** | EV-GRAPH |
| **Risks reduced** | Boundary breach, hub overload |

---

### ROMA DevOps (proposed)

| Field | Value |
|-------|-------|
| **Purpose** | Deploy proof, CI integrity, buildStamp alignment |
| **Inputs** | CI events, health endpoints |
| **Outputs** | OBS domain signals, deploy gate status |
| **Evidence** | EV-STAMP, EV-BUILD |
| **Risks reduced** | Wrong SHA deployed, broken pipeline |

---

### ROMA Compliance (proposed)

| Field | Value |
|-------|-------|
| **Purpose** | Policy packs, audit trails, retention rules |
| **Inputs** | Compliance rule sets, evidence index |
| **Outputs** | Compliance posture report |
| **Evidence** | Aggregated refs from Evidence Service |
| **Risks reduced** | Audit gap, undocumented waivers |

---

## 5. Application SDK Operations

| Operation | Description |
|-----------|-------------|
| `register(manifest)` | Kernel compatibility check |
| `enable()` / `disable()` | Steward-gated |
| `on_event(type, payload)` | Subscribe to kernel bus |
| `request_plan(context)` | Via Planning Service |
| `emit_finding(finding)` | Via Evidence + Decision routing |
| `report()` | Via Reporting Service |

---

## 6. Future Extensions

- App-to-app dependencies (Security requires QA inventory sync)  
- Per-app Memory namespaces  
- Application certification program for third-party apps

---

## 7. Open Questions

| ID | Question |
|----|----------|
| Q1 | Can two apps share one `run_id` slice budget? |
| Q2 | Product Quality app separate from QA or merged? |
| Q3 | Security as separate app vs QA SEC subsystem at Stage 3? |

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-03 | Initial application model |
