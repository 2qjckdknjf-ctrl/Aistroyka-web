# ADR-0009: ROMA OS Evolution

**Status:** Accepted  
**Date:** 2026-07-03  
**Deciders:** ROMA architecture, platform leadership  
**Supersedes:** — (extends, does not replace Stages 0–2B)  
**Related:** `ROMA_CONSTITUTION.md`, `ROMA_OS_ARCHITECTURE.md`, `ROMA_COMPATIBILITY_POLICY.md`

---

## Context

Stages 0–2B built a rigorous **ROMA QA Framework**: architecture, governance, intelligence layer, cognitive models, and enforceable schemas. The work product is substantial and production-ready as **documentation and contracts**.

The platform’s ambition exceeds QA alone: Security, AI Audit, Performance, Mobile, Architecture, Compliance, and DevOps assurance share the same needs — evidence-first decisions, reasoning, memory, and release confidence — but should not each fork a separate “framework.”

AISTROYKA is the first deployment target, not the definition of the platform. Tooling (Playwright, GitHub Actions, Supabase, Cloudflare) must remain swappable.

---

## Decision

**ROMA evolves from a QA Framework into ROMA OS — an Engineering Intelligence Operating System.**

1. **ROMA OS** is the umbrella platform (kernel, intelligence, platform services, adapter model).  
2. **ROMA QA** is the **first application** — Stages 0–2B remain its specification.  
3. **AISTROYKA Project Adapter** is the **first project adapter**.  
4. New OS documentation lives under `docs/roma/os/` without mass-renaming existing docs.  
5. Constitution (`ROMA_CONSTITUTION.md`) is normative for all future apps and adapters.  
6. Stage 2C delivers OS kernel & constitution; Stage 3+ implements QA app adapters under OS rules.

---

## Rationale

| Driver | Explanation |
|--------|-------------|
| Reuse intelligence | Reasoning, risk, memory, and release models apply beyond QA |
| Vendor neutrality | Kernel cannot bind to Playwright or Supabase |
| Project portability | Next product adds Project Adapter, not new kernel |
| Protect investment | Stages 0–2B schemas and ADRs stay valid |
| Clear governance | Constitution prevents autopilot and secret leakage |

---

## Consequences

### Positive

- Single control plane for engineering intelligence across apps  
- QA team ships first app without rewriting intelligence  
- Security/AI Audit can register later with same Decision/Evidence services  
- Clear onboarding path for Tool Adapters in Stage 3  

### Negative / Cost

- Dual vocabulary during transition (“Framework” vs “OS”) — mitigated by compatibility aliases  
- Additional documentation surface (`docs/roma/os/`)  
- Implementers must learn Kernel vs Application boundary  

### Neutral

- `ROMA_ARCHITECTURE.md` title unchanged; §OS note added  
- Runtime module naming deferred to Stage 3 implementation  

---

## Compatibility

| Artifact | Treatment |
|----------|-----------|
| Stages 0–2B all docs | Valid; no renames |
| ADR-0001–0008 | Binding |
| `docs/roma/schemas/*` | Kernel contracts |
| `docs/roma/intelligence/*` | Intelligence Layer |
| ROMA QA Framework (phrase) | Alias for QA application + Stages 0–2B |
| Merge tracker / roadmap | Add Stage 2C OS; renumber machine-schema work to 2D |

---

## Migration Strategy

**Phase 1 (Stage 2C — now):** Constitution, OS architecture, kernel, app/adapter models, platform services, compatibility policy, ADR-0009.

**Phase 2 (Stage 2D — optional):** Machine JSON Schema files + fixture validator (previously listed as 2C).

**Phase 3 (Stage 3):** QA app Tool Adapters (WEB/BCK/SEC) register with kernel; AISTROYKA Project Adapter inventory sync.

**Phase 4 (Stage 4+):** Additional applications proposed → registered → enabled per Application Model.

No file deletions. No forced renames. Narrative updates only where minimally required.

---

## Rejected Alternatives

### 1. Keep ROMA as QA-only framework

**Rejected:** Intelligence and schemas already generalize; second app would duplicate kernel. OS model captures reality without throwing away 2B contracts.

### 2. Mass rename all docs now

**Rejected:** Breaks links, PR history, and merge tracker; violates CP-02. Additive `docs/roma/os/` is sufficient.

### 3. Implement applications before kernel

**Rejected:** Would embed Playwright/Supabase in “core” and violate vendor neutrality. Kernel contracts first (Stage 2C), adapters Stage 3.

### 4. Bind kernel directly to Playwright / GitHub / Supabase

**Rejected:** Constitution Art. I.4 and Kernel prohibitions. Tool Adapters only.

---

## Compliance

- All new applications must register via Application SDK  
- All tools must register via Adapter Model  
- Constitution Articles I.1–I.12 cannot be waived by app manifest  

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-03 | Initial ROMA OS evolution decision |
