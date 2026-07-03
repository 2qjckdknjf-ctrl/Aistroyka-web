# ROMA Stage 2B Review — Schemas & Contracts

**Document ID:** ROMA-STAGE2B-REVIEW  
**Date:** 2026-07-03  
**Branch:** `feature/roma-qa-framework`  
**Reviewer:** ROMA architecture (automated stage gate)

---

## 1. Created Documents

### Schemas (`docs/roma/schemas/`)

| # | Document | Schema ID |
|---|----------|-----------|
| 1 | `reasoning_trace.schema.md` | `rt_v1` |
| 2 | `decision_bundle.schema.md` | `db_v1` |
| 3 | `state_snapshot.schema.md` | `ss_v1` |
| 4 | `risk_manifest.schema.md` | `rm_v1` |
| 5 | `run_plan.schema.md` | `rp_v1` |
| 6 | `evidence_bundle.schema.md` | `eb_v1` |
| 7 | `coverage_snapshot.schema.md` | `cs_v1` |
| 8 | `release_confidence.schema.md` | `rc_v1` |
| 9 | `knowledge_update.schema.md` | `ku_v1` |

### Contracts & registry

| Document | Purpose |
|----------|---------|
| `ROMA_INTERFACE_CONFORMANCE_MATRIX.md` | 25 IF-* interfaces mapped |
| `registries/rt-critical-modules.yaml.md` | 12 RT-Critical modules (draft v0.1) |
| `adr/ADR-0008-T0-REASONING-DEPTH.md` | T0 abbreviated vs full reasoning |

### Fixtures (`docs/roma/fixtures/`)

| Fixture | Scenario coverage |
|---------|-------------------|
| `reasoning_trace.example.json.md` | Auth change |
| `decision_bundle.example.json.md` | Worker report + mobile + AI council |
| `risk_manifest.example.json.md` | Worker report + media + release workflow |
| `run_plan.example.json.md` | AI Copilot + auth + health |
| `release_confidence.example.json.md` | Pilot RC + mobile + release gates |

---

## 2. Schemas Summary

All nine schema docs include: purpose, required/optional fields, types, enums, example object, validation rules, failure handling, Stage 2A relation.

Cross-version tokens: `cog_v1`, `rt_v1`, `db_v1`, `rm_v1`, `rp_v1`, `eb_v1`, `cs_v1`, `rc_v1`, `ku_v1`, `ss_v1`.

`reasoning_trace` integrates ADR-0008 `reasoning_mode: full | abbreviated_t0`.

---

## 3. Interface Coverage

| Metric | Result |
|--------|--------|
| IF-* interfaces in Stage 2A | 25 |
| Mapped in conformance matrix | 25 (100%) |
| With primary schema doc | 22 |
| Deferred standalone schema (matrix ref) | 3 — regression_forecast, DOMAIN_VERDICT_BOARD, reports_index |

---

## 4. Registry Summary

| Module ID | Subsystems |
|-----------|------------|
| RTCRIT-AUTH | WEB, BCK, SEC |
| RTCRIT-TENANT-ISOLATION | DB, BCK, SEC, AI |
| RTCRIT-RBAC | WEB, SEC, DB |
| RTCRIT-WORKER-REPORT | WEB, BCK, IOS, AND, DB |
| RTCRIT-MEDIA-UPLOAD | BCK, WEB, IOS, AND |
| RTCRIT-MANAGER-APPROVALS | WEB, BCK, IOS |
| RTCRIT-DOCUMENTS | WEB, BCK, SEC |
| RTCRIT-FINANCE-ISOLATION | SEC, WEB |
| RTCRIT-AI-COPILOT | AI, BCK, SEC, WEB |
| RTCRIT-SYSTEM-HEALTH | BCK, OBS, REL |
| RTCRIT-RELEASE-WORKFLOW | REL, OBS, CORE |
| RTCRIT-MOBILE-WORKER | IOS, AND, BCK |

Steward placeholders assigned; formal owner sign-off pending.

---

## 5. Fixture Summary

Fixtures are realistic for AISTROYKA: staging URLs, `buildStamp`, pilot P3 Android defer, finance isolation, FLOW-J3, ADR refs, registry module IDs.

Scenarios requested: auth ✅, worker report ✅, AI Copilot ✅, mobile worker ✅, release workflow ✅.

---

## 6. Unresolved Issues

| ID | Issue | Target |
|----|-------|--------|
| U1 | Machine `.json` Schema files (JSON Schema draft) | Stage 2C |
| U2 | Automated fixture validation CI | Stage 2C |
| U3 | `regression_forecast.schema.md` standalone | Stage 2C |
| U4 | Registry steward formal approval | Architecture owner |
| U5 | T0 abbreviated reasoning fixture example | Optional 2C |
| U6 | Extract YAML registry to separate `.yaml` file | Stage 3 if tooling requires |

---

## 7. Readiness for Stage 2C

Stage 2C recommended scope:

1. Machine-readable JSON Schema files mirroring `.schema.md`
2. Fixture validation script (docs-only or `scripts/roma/` in later stage)
3. `ROMA_SCHEMA_INDEX.md` catalog
4. Conformance test checklist for Stage 3 adapter onboarding

Stage 3 adapters (WEB/BCK/SEC) may begin design against Stage 2B contracts; runtime validation lands with Core plan gate.

---

## 8. Validation Performed

| Check | Result |
|-------|--------|
| All 9 schema docs exist | ✅ |
| Schema version IDs consistent | ✅ |
| All 25 IF-* mapped | ✅ |
| ADR-0008 created | ✅ |
| No package.json changes | ✅ |
| docs/roma only scope | ✅ |

---

## 9. Verdict

```
ROMA_STAGE2B_READY = YES
```

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-03 | Stage 2B review |
