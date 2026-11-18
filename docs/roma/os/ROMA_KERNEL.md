# ROMA OS Kernel

**Document ID:** ROMA-OS-KERNEL-001  
**Version:** 1.0  
**Date:** 2026-07-03  
**Status:** Stage 2C (design only)  
**Parent:** `ROMA_OS_ARCHITECTURE.md`, `ROMA_CONSTITUTION.md`

---

## 1. Purpose

Defines the **ROMA OS Kernel** — minimal orchestration core that all applications and adapters depend on. The kernel is the only component allowed to coordinate cross-application lifecycle and enforce compatibility policy.

Stage 1 `ROMA_CORE_SPEC.md` describes the **QA-era orchestration kernel**; this document generalizes that role for ROMA OS without invalidating the prior spec (compatibility alias).

---

## 2. Kernel Responsibilities

| # | Responsibility | Description |
|---|----------------|-------------|
| K1 | **Lifecycle orchestration** | Run phases: init → plan → execute → collect → decide → learn → report (maps to `ROMA_STATE_MACHINE.md`) |
| K2 | **Event routing** | Publish/subscribe: `change.detected`, `plan.ready`, `evidence.collected`, `decision.committed`, `app.retired` |
| K3 | **Capability registry** | Register kernel-exposed capabilities (plan, evidence, memory, …) with version |
| K4 | **Application registration** | Accept Application SDK manifests; enable/disable apps |
| K5 | **Adapter registration** | Register Project, Tool, Evidence adapters with contract version |
| K6 | **Evidence routing** | Route artifacts to Evidence Service; enforce `evidence_bundle` schema |
| K7 | **Decision routing** | Forward `decision_bundle` to Policy/Release services and humans |
| K8 | **State transitions** | Enforce `state_snapshot` lifecycle guards |
| K9 | **Compatibility enforcement** | Reject contracts below minimum `cog_v1` / schema versions |
| K10 | **Version policy enforcement** | Deprecation windows per `ROMA_COMPATIBILITY_POLICY.md` |

---

## 3. Kernel Interfaces (Exposed)

| Interface | Direction | Contract |
|-----------|-----------|----------|
| `IK-LIFECYCLE` | Apps → Kernel | `start_run`, `advance_state`, `abort_run` |
| `IK-REGISTER-APP` | Apps → Kernel | Application manifest |
| `IK-REGISTER-ADAPTER` | Adapters → Kernel | Adapter manifest |
| `IK-EVENT-BUS` | Bidirectional | Typed events |
| `IK-PLAN-REQUEST` | Apps → Kernel | Triggers intelligence planning pipeline |
| `IK-EVIDENCE-INGEST` | Adapters → Kernel | Evidence refs |
| `IK-DECISION-EMIT` | Intelligence → Kernel | `decision_bundle` |
| `IK-POLICY-CHECK` | Kernel → Policy Service | Blocking evaluation |

Maps to Stage 2B `IF-CORE-*` interfaces for QA application compatibility.

---

## 4. Kernel Must NOT

| Prohibition | Reason |
|-------------|--------|
| Run Playwright directly | Tool Adapter only |
| Run Maestro / Appium directly | Tool Adapter only |
| Know Supabase schema directly | Project + Tool Adapters |
| Know Cloudflare Workers directly | Project + Tool Adapters |
| Know GitHub Actions YAML directly | Tool Adapter |
| Call LLM providers directly | Tool Adapter (AI Audit app) |
| Modify product code | Constitution Art. I.10–11 |
| Mutate production data | Constitution Art. I.11 |
| Embed AISTROYKA-specific routes | Project Adapter only |
| Store secrets | Constitution Art. I.12 |

---

## 5. Inputs

| Input | Source |
|-------|--------|
| Application manifests | Application SDK |
| Adapter manifests | Adapter Model |
| Trigger context | CI, human, schedule (via Tool Adapter) |
| Policy rules | ADRs, Compatibility Policy |
| Schema versions | `docs/roma/schemas/` |

---

## 6. Outputs

| Output | Consumer |
|--------|----------|
| `run_id` | All services and apps |
| `state_snapshot.json` | OBS, resume |
| Routed events | Applications, Platform Services |
| Compatibility violations | Operator logs, `INVESTIGATE` |
| Registration ACK/NACK | Apps, adapters |

---

## 7. Relationship to ROMA Core Spec (Stage 1)

| ROMA Core (Stage 1) | ROMA OS Kernel |
|---------------------|----------------|
| Subsystem registry | Capability + Application + Adapter registries |
| Run plans | Planning Service + Kernel lifecycle |
| PQS emission | QA App + Release Service |
| Credential profiles | Project Adapter + Policy Service |
| Artifact paths | Evidence Service |

**Both names remain valid** until Stage 3 implementation chooses a single runtime module name.

---

## 8. Future Extensions

- Kernel plugins (governance-gated) for custom event types  
- Multi-tenant kernel instances per organization  
- Signed manifests for third-party applications  
- Kernel HA / leader election (runtime concern)

---

## 9. Open Questions

| ID | Question |
|----|----------|
| Q1 | Event bus in-process vs message queue at scale? |
| Q2 | Kernel watchdog for stuck S5 evidence collect? |
| Q3 | Minimum apps required for kernel boot (QA only vs QA+Security)? |

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-03 | Initial kernel specification |
