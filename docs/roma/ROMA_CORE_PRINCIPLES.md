# ROMA — Core Principles

**Document ID:** ROMA-PRIN-001  
**Version:** 1.0  
**Date:** 2026-07-03  
**Parent:** `ROMA_ARCHITECTURE.md`

---

## 1. Purpose

This document defines the non-negotiable principles governing ROMA design, operation, and future implementation. Principles outrank convenience: when speed conflicts with truth, truth wins.

---

## 2. Design Philosophy

### 2.1 Assurance is infrastructure

Quality validation is as permanent as CI and deployment pipelines. ROMA is budgeted, owned, and versioned — not a volunteer effort before releases.

*Rationale:* Ephemeral QA collapses under delivery pressure; infrastructure persists.

### 2.2 The product is the oracle

ROMA validates what exists. It does not specify what should exist unless recording a **documented gap**. Missing features produce gap findings, not green tests.

*Rationale:* Fake tests create false confidence and erode council trust.

### 2.3 Personas are first-class

Every scenario declares its acting persona: guest, contractor owner, manager, foreman (as mapped role), worker, client/stakeholder, platform admin, security auditor, AI evaluator.

*Rationale:* AISTROYKA is RBAC-dense; anonymous tests miss most failure modes.

### 2.4 Evidence is the unit of truth

A verdict without artifacts is INVALID. Artifacts include logs, traces, screenshots, HAR summaries, JSON payloads, build stamps, and reproducible run IDs.

*Rationale:* Enables audit, learning, and dispute resolution during release council.

### 2.5 UNKNOWN is honest

Insufficient credentials, skipped subsystems, or missing environments yield **UNKNOWN**, never PASS.

*Rationale:* Prevents silent weakening of release gates.

---

## 3. Core Principles (Catalog)

| ID | Principle | Implication |
|----|-----------|-------------|
| P01 | **Real functionality only** | No synthetic metrics, mock production scale, or UI-only backends |
| P02 | **Fail-closed reporting** | Ambiguity → UNKNOWN; council interprets |
| P03 | **Tenant isolation invariant** | Fixtures scoped; probes must not cross tenants |
| P04 | **Customer finance isolation** | Stakeholder/client assertions use denylist + positive allowlist |
| P05 | **Discovery before assertion** | Inventory sync precedes coverage claims |
| P06 | **Tiered execution** | T0–T3 depth matched to trigger and cost |
| P07 | **Subsystem boundaries** | No subsystem reaches into another's domain logic |
| P08 | **Orchestration centralization** | Only ROMA Core schedules; subsystems do not self-trigger release |
| P09 | **Idempotent runs** | Same inputs + SHA → comparable outputs (flake excepted via Learning) |
| P10 | **Environment explicitness** | Every finding tagged: local / staging / pre-prod / prod |
| P11 | **Secret hygiene** | Profiles reference secret names; zero secrets in repo |
| P12 | **Dual readability** | Every verdict has JSON + human summary |
| P13 | **Non-destructive default** | No prod mutations; chaos staging-only |
| P14 | **Learning closure** | P0/P1 → debt register → roadmap input |
| P15 | **Additive evolution** | New capabilities via registry, not Core rewrite |

---

## 4. AISTROYKA-Specific Invariants

These inherit from product policy and must never be relaxed in ROMA:

1. **Customer/owner must not see internal financial state** (margin, internal costs, budget pressure, subcontractor prices, internal AI finance risk).  
   *QA implication:* ROMA Web portal + ROMA Backend JSON probes enforce denylist checks.

2. **Tenant_id remains operational RLS boundary** — account layer does not replace isolation tests.  
   *QA implication:* ROMA Database maintains tenant-scoped CRUD scenarios.

3. **Lite mobile clients are allow-list gated** (`ios_lite`, `android_lite`, worker variants).  
   *QA implication:* ROMA Backend validates 403 outside allow-list.

4. **Platform owner is grant-gated**, not tenant admin.  
   *QA implication:* Separate credential profile; never conflated with contractor owner.

5. **AI live claims require live provider proof** — copilot SSE or vision 200 alone insufficient if fallback headers present.  
   *QA implication:* ROMA AI distinguishes LIVE vs FALLBACK vs DISABLED.

---

## 5. Anti-Patterns (Forbidden)

| Anti-pattern | Why forbidden |
|--------------|---------------|
| Self-approving release without artifacts | Council bypass |
| Hardcoded production tenant IDs in tests | Data corruption risk |
| Cross-subsystem shared mutable state | Flake amplification |
| Retrying until green without Learning ticket | Hides systemic issues |
| Marking PASS when test skipped | Violates P02 |
| Chaos in production | Violates P13 |
| Single "mega test" owning all domains | Violates P07, blocks scale |

---

## 6. Development Standards (Future Implementation)

When ROMA moves from architecture to code, all implementations MUST:

### 6.1 Contract-first subsystems

Each subsystem implements four operations for ROMA Core:

| Operation | Responsibility |
|-----------|----------------|
| `plan` | Given tier + environment, return executable manifest |
| `execute` | Run manifest, write raw artifacts |
| `collect` | Normalize raw → finding records |
| `verdict` | Emit YES/NO/UNKNOWN per domain slice |

### 6.2 Finding record schema (minimum fields)

- `finding_id` (stable)  
- `subsystem`  
- `severity` (P0–P3 / R0–R4)  
- `environment`  
- `build_stamp`  
- `persona`  
- `evidence_refs[]`  
- `status` (confirmed | suspected | gap)  
- `message` (human)  

### 6.3 Naming conventions

- Subsystem codes: `CORE`, `WEB`, `IOS`, `AND`, `BCK`, `DB`, `AI`, `SEC`, `A11Y`, `PERF`, `CHS`, `OBS`, `REL`, `LRN`  
- Run ID: `roma-{YYYYMMDD}-{sha7}-{seq}`  
- Artifact root: `docs/roma/runs/{run_id}/` (future)

### 6.4 Language & tooling neutrality

Architecture does not mandate Playwright, XCTest, or Espresso. Subsystems choose tools; Core enforces contracts. *Rationale:* Mobile and AI have different optimal stacks.

### 6.5 Test data policy

- Staging-first; production probes read-only and council-approved only.  
- Seed scripts idempotent; tagged `roma-fixture-*` for cleanup.  
- Stakeholder finance tests use dedicated smoke account — never pilot owner.

---

## 7. Documentation Standards

| Rule | Requirement |
|------|-------------|
| DS-01 | Every doc has ID, version, date, status |
| DS-02 | Decisions include **rationale** paragraph |
| DS-03 | Boundaries use **owns / does not own** lists |
| DS-04 | UNKNOWN handling explicitly documented |
| DS-05 | Cross-links between ROMA docs maintained |
| DS-06 | ADR for contract-breaking changes |
| DS-07 | Operator runbooks separate from architecture |
| DS-08 | Glossary updated when new terms introduced |

---

## 8. Governance

| Role | Responsibility |
|------|----------------|
| **ROMA Architecture Owner** | Contract stability, subsystem registry |
| **Subsystem Steward** | Per-domain manifest accuracy |
| **Release Council** | Threshold tuning, CONDITIONAL GO authority |
| **Security Owner** | R0 definition updates, prod probe approval |

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-03 | Initial principle catalog |
