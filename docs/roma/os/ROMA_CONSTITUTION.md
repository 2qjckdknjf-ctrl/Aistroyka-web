# ROMA Constitution

**Document ID:** ROMA-OS-CONST-001  
**Version:** 1.0  
**Date:** 2026-07-03  
**Status:** Stage 2C — Normative (design only)  
**Parent:** `ROMA_OS_ARCHITECTURE.md`  
**Scope:** ROMA OS — all kernels, applications, adapters, and projects

---

## Preamble

ROMA OS is an **Engineering Intelligence Operating System** — project-neutral, vendor-neutral, and human-governed. This constitution defines non-negotiable principles that no application, adapter, or kernel extension may violate.

The **ROMA QA Framework** (Stages 0–2B) remains valid as the first application under this constitution. AISTROYKA is the first Project Adapter.

---

## Article I — Non-Negotiable Principles

### 1. Human in Control

Humans retain final authority over release, production changes, and irreversible actions. ROMA OS recommends; humans decide. Council, owners, and stewards may override intelligence outputs with documented rationale.

*Rationale:* Engineering judgment cannot be delegated to automation without accountability.

---

### 2. Evidence First

No PASS, YES, GO, or “safe” claim without traceable evidence artifacts. Verdicts cite evidence refs per `docs/roma/schemas/evidence_bundle.schema.md`.

*Rationale:* Prevents synthetic confidence and audit failure.

---

### 3. UNKNOWN is not PASS

Ambiguity resolves to **UNKNOWN** or **Insufficient Evidence** — never silent success. Skips, missing profiles, and absent environments downgrade posture; they do not imply approval.

*Rationale:* Fail-closed culture from Stage 0; preserved across all applications.

---

### 4. Vendor Neutral

ROMA OS Kernel and Platform Services depend on **adapter contracts only** — never on Playwright, GitHub Actions, Supabase, Cloudflare, Maestro, or any single vendor SDK directly.

*Rationale:* Tooling changes without kernel redesign.

---

### 5. Project Neutral

Kernel semantics are independent of AISTROYKA (or any product). Project-specific routes, roles, finance rules, and mobile apps map through **Project Adapters** only.

*Rationale:* Reuse OS across repos and products.

---

### 6. Modular Applications

QA, Security, AI Audit, Performance, Mobile, Architecture, Compliance, and DevOps are **applications** — pluggable modules with declared inputs, outputs, and capabilities. No application owns the kernel.

*Rationale:* QA was never the whole platform; it is the first app.

---

### 7. Kernel / Application Separation

```
Kernel → Platform Services → Applications
         ↑
    Adapters (Project, Tool, Evidence)
```

Kernel must never import application logic. Applications consume kernel interfaces (`ROMA_KERNEL.md`).

*Rationale:* Stability of the control plane.

---

### 8. Safe by Default

Default posture is conservative: UNKNOWN, advisory recommendations, blocked release on R0, no auto-merge, no auto-deploy from intelligence alone.

*Rationale:* Aligns with ADR-0002, ADR-0007, ADR-0008.

---

### 9. Explainable Decisions

Every decision includes rationale: reasoning traces (`reasoning_trace.schema.md`), confidence, and evidence gaps. Black-box scores are insufficient for release-blocking recommendations.

*Rationale:* Stage 2A Reasoning Model is constitutional law for intelligence.

---

### 10. Learning Without Acting

Memory and Feedback store patterns and recommendations. ROMA OS **never** auto-modifies product code, production data, or infrastructure based on learning alone.

*Rationale:* ADR-0007 extended to OS scope.

---

### 11. No Automatic Irreversible Actions

No kernel or application may automatically: merge to protected branches, deploy to production, delete data, rotate secrets, or alter billing — without explicit human-gated workflows outside ROMA OS default path.

*Rationale:* Irreversible ops stay outside intelligence autopilot.

---

### 12. No Secrets / No Production Credentials in Memory

Memory Service stores engineering knowledge only. No API keys, tokens, pilot client PII, or production credentials in memory, knowledge graph nodes, or published reports.

*Rationale:* Extends `ROMA_MEMORY_MODEL.md` to OS-wide law.

---

## Article II — Amendment

Constitution changes require ADR + architecture owner review. Applications and adapters cannot opt out of Articles I.1–I.12.

---

## Article III — Relationship to Prior Stages

| Prior artifact | Status under constitution |
|----------------|---------------------------|
| Stages 0–2B docs | Valid; compatibility alias “ROMA QA Framework” |
| ADRs 0001–0008 | Binding unless superseded by later ADR |
| `docs/roma/intelligence/*` | Intelligence Layer under OS |
| `docs/roma/schemas/*` | Kernel contract artifacts |

See `ROMA_COMPATIBILITY_POLICY.md` and `ADR-0009-ROMA-OS-EVOLUTION.md`.

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-03 | Initial ROMA OS constitution |
