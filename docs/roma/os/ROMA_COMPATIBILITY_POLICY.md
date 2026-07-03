# ROMA Compatibility Policy

**Document ID:** ROMA-OS-COMPAT-001  
**Version:** 1.0  
**Date:** 2026-07-03  
**Status:** Stage 2C (normative)  
**Parent:** `ROMA_CONSTITUTION.md`, `ADR-0009-ROMA-OS-EVOLUTION.md`

---

## 1. Purpose

Ensures **ROMA OS evolution** does not break Stages 0–2B investments. Governs naming, versioning, migration, and deprecation without mass renames.

---

## 2. Stage 0–2B Compatibility Guarantee

| Rule | Policy |
|------|--------|
| **CP-01** | All Stage 0–2B documents remain valid and linkable |
| **CP-02** | No mass rename of existing filenames or document IDs |
| **CP-03** | Behavioral semantics of schemas `rt_v1`–`ku_v1` unchanged unless new schema version |
| **CP-04** | ADRs 0001–0008 remain binding unless explicitly superseded |
| **CP-05** | `docs/roma/intelligence/`, `docs/roma/schemas/`, `docs/roma/fixtures/` paths stable |

---

## 3. Naming and Aliases

| Term | Status |
|------|--------|
| **ROMA QA Framework** | Compatibility alias for ROMA QA Application + Stages 0–2B docs |
| **ROMA Core** | Alias for Kernel + Core-era orchestration (Stage 1 spec) |
| **ROMA OS** | Umbrella platform name from Stage 2C onward |
| **ROMA** alone | Context-dependent; prefer qualified names in new docs |

New documents under `docs/roma/os/` use **ROMA OS** terminology. Existing docs are **not** renamed.

---

## 4. Deprecated Terms Policy

| Term | Guidance |
|------|----------|
| “ROMA is a QA framework only” | Deprecated narrative; use “ROMA OS with QA as first app” |
| “Subsystem owns platform” | Deprecated; subsystems are QA app capabilities |

Deprecation is **documentation narrative only** — not file deletion.

---

## 5. Versioning

### Schema versions

| Family | Current | Bump triggers |
|--------|---------|---------------|
| `rt_v1`, `db_v1`, … | Stage 2B | Breaking required field or enum |
| `cog_v1` | Stage 2A | Reasoning model breaking change |
| `app_sdk_v1` | Stage 2C | Application manifest breaking change |
| `adapter_v1` | Stage 2C | Adapter contract breaking change |

**Rule:** Producers must emit `schema_version`. Consumers reject unknown major versions.

### Adapter versioning

`contract_version` in adapter manifest. Kernel supports N and N-1 during deprecation window (min 90 days documented).

### Application versioning

`app_version` semver. Enabled apps must match Registry Service compatibility matrix.

---

## 6. Migration Policy

| From | To | Strategy |
|------|-----|----------|
| ROMA QA Framework mental model | ROMA OS | ADR-0009; additive `docs/roma/os/` |
| ROMA Core spec | ROMA Kernel | Parallel docs; runtime alias until Stage 3 |
| Subsystem adapters | Tool Adapters under QA app | Incremental Stage 3–8; no big-bang |
| Exploratory `docs/qa/` | ROMA-emitted runs | ADR-0006 unchanged |

**No migration** requires deleting Stage 0–2B files.

---

## 7. Deprecation Policy

1. Announce in ADR or Compatibility Service bulletin  
2. Mark deprecated in Registry Service  
3. Support N and N-1 for one release cycle minimum  
4. Archive tag + merge tracker note before removal  
5. Never delete open-gate evidence docs without council ack  

---

## 8. Breaking Change Policy

Breaking changes require:

- ADR with migration guide  
- Schema version bump  
- Fixture updates in `docs/roma/fixtures/`  
- `ROMA_INTERFACE_CONFORMANCE_MATRIX.md` update  
- Stage review verdict before merge to `main`

Kernel **must not** break QA app without dual-support window.

---

## 9. Rejected Approaches (See ADR-0009)

- Mass rename all docs now  
- Bind kernel to Playwright/GitHub/Supabase directly  
- Implement applications before kernel contracts  

---

## 10. Open Questions

| ID | Question |
|----|----------|
| Q1 | When to add `ROMA_OS` prefix to new ADR IDs only? |
| Q2 | Machine schema `.json` — still Stage 2D or folded into Stage 3? |
| Q3 | Public npm package name if runtime kernel ships? |

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-03 | Initial compatibility policy |
