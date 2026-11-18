# ROMA OS — Architecture

**Document ID:** ROMA-OS-ARCH-001  
**Version:** 1.0  
**Date:** 2026-07-03  
**Status:** Stage 2C (design only)  
**Parent:** `ROMA_CONSTITUTION.md`  
**Compatibility:** Stages 0–2B preserved (`ROMA_COMPATIBILITY_POLICY.md`)

---

## 1. Vision

**ROMA OS** (Reliable Operations & Modular Assurance — Operating System) is a **project-neutral, vendor-neutral Engineering Intelligence Operating System**.

It provides:

- A stable **kernel** for lifecycle, events, and contracts  
- **Intelligence** for reasoning, risk, planning, and release confidence  
- **Platform Services** shared by all applications  
- **Applications** (QA first) that reduce specific engineering risks  
- **Adapters** that connect projects and tools without binding the kernel  

**AISTROYKA** is the first **Project Adapter**. **ROMA QA** is the first **Application**.

---

## 2. Why QA Becomes an Application (Not the Whole Platform)

| Before (Stage 0–2B framing) | After (ROMA OS) |
|------------------------------|-----------------|
| “ROMA QA Framework” = the platform | ROMA OS = platform; QA = one app |
| Intelligence serves QA only | Intelligence serves all apps |
| Subsystems (WEB, SEC) = ROMA parts | Subsystems = QA app capabilities via Tool Adapters |
| AISTROYKA assumptions in Core | AISTROYKA → Project Adapter |

Stage 0–2B documents remain authoritative for QA application behavior. They are **not** rewritten — they are **mounted** under the OS model per ADR-0009.

---

## 3. Layered Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        APPLICATIONS LAYER                                │
│  ROMA QA │ Security │ AI Audit │ Performance │ Mobile │ Arch │ …       │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ Application SDK (register, execute, report)
┌───────────────────────────────▼─────────────────────────────────────────┐
│                      PLATFORM SERVICES LAYER                             │
│  Registry │ Evidence │ Memory │ Knowledge │ Decision │ Risk │ Plan │ …  │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────────┐
│                      INTELLIGENCE LAYER (Stage 2/2A/2B)                  │
│  Reasoning │ Decision │ Memory/Knowledge/Feedback models │ Engines       │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────────┐
│                           ROMA OS KERNEL                                 │
│  Lifecycle │ Events │ Capabilities │ Registration │ Routing │ Policy    │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ adapter contracts only
        ┌───────────────────────┴───────────────────────┐
        ▼                                               ▼
┌───────────────────┐                         ┌───────────────────┐
│ PROJECT ADAPTERS  │                         │  TOOL ADAPTERS    │
│ AISTROYKA (first) │                         │ Playwright, CI, … │
└───────────────────┘                         └───────────────────┘
        │                                               │
        └───────────────────┬───────────────────────────┘
                            ▼
                  ┌───────────────────┐
                  │ EVIDENCE ADAPTERS │
                  │ traces, logs, …   │
                  └───────────────────┘
```

---

## 4. Architecture Rules (Hard)

| Rule | Statement |
|------|-----------|
| **AR-01** | Kernel must **never** depend on applications |
| **AR-02** | Applications depend on kernel + platform service contracts |
| **AR-03** | Tools connect **only** through Tool Adapters |
| **AR-04** | Projects connect **only** through Project Adapters |
| **AR-05** | Intelligence recommends; Policy/REL/humans enforce |
| **AR-06** | No mass rename of Stage 0–2B docs |

---

## 5. Component Definitions

### Kernel (`ROMA_KERNEL.md`)

Orchestration spine: lifecycle, events, registration, routing, compatibility enforcement. No vendor or product knowledge.

### Intelligence Layer

Stages 2, 2A, 2B — cognitive models, engines, schemas. Becomes a kernel-adjacent layer consumed by Platform Services (Decision, Risk, Planning, etc.).

### Platform Services (`ROMA_PLATFORM_SERVICES.md`)

Shared capabilities: registry, evidence store, memory, knowledge graph API, decision bundle emission, etc.

### Application SDK (`ROMA_APPLICATION_MODEL.md`)

Contract for apps to: register capabilities, declare inputs/outputs, request plans, emit findings, subscribe to events.

### Application Registry

Catalog of installed apps (QA, Security, …) with versions, enabled state, and capability declarations.

### Project Adapter Layer

Maps project inventory: routes, APIs, roles, mobile apps, finance boundaries. **AISTROYKA Adapter** implements first instance.

### Tool Adapter Layer

Maps external tools to kernel evidence and execution contracts (Playwright → slices, GH Actions → triggers, etc.).

### Applications Layer

Domain-specific intelligence consumers that produce findings and reduce specific risk classes.

---

## 6. Compatibility with Stage 0–2B

| Stage 0–2B concept | ROMA OS mapping |
|--------------------|-----------------|
| ROMA Core | Kernel + Platform Services (partial); Core spec remains QA-era name |
| ROMA Intelligence | Intelligence Layer (unchanged path `docs/roma/intelligence/`) |
| Subsystems WEB/BCK/SEC | QA Application capabilities via Tool Adapters (Stage 3+) |
| `docs/roma/schemas/*` | Kernel contract artifacts |
| PQS / REL | QA + Release Platform Services |
| ADR-0001–0008 | Binding; ADR-0009 adds OS evolution |

---

## 7. Future Applications (Planned)

QA, Security, AI Audit, Performance, Mobile Audit, Architecture Audit, Compliance, DevOps, Product Quality — registered per `ROMA_APPLICATION_MODEL.md`; not implemented in Stage 2C.

---

## 8. Future Extensions

- Multi-project federation (several Project Adapters one kernel)  
- Marketplace-style third-party applications (governance TBD)  
- OS-level API gateway for external CI triggers  
- Cross-app evidence correlation (Security + QA unified council brief)

---

## 9. Open Questions

| ID | Question |
|----|----------|
| Q1 | Rename “ROMA Core” doc to “Kernel” in Stage 3+ or keep alias forever? |
| Q2 | Single monorepo kernel package vs docs-only until Stage 3? |
| Q3 | Application isolation: shared Memory or per-app namespaces? |

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-03 | Initial ROMA OS architecture |
