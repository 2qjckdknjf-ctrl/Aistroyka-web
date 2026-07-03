# ROMA Core — Specification

**Document ID:** ROMA-CORE-001  
**Version:** 1.0  
**Date:** 2026-07-03  
**Status:** Stage 1 Governance (design only — no runtime implementation in this stage)  
**Parent:** `ROMA_ARCHITECTURE.md`  
**ADRs:** `docs/roma/adr/`

---

## 1. Purpose

Defines ROMA Core: the orchestration and governance kernel that schedules subsystems, normalizes evidence, applies verdict rules, and emits reports — without owning domain-specific test logic.

Stage 1 delivers this **specification and policy layer**. Runtime registry YAML, inventory jobs, and adapter wrappers are Stage 1 **exit** deliverables (code), not in scope for this documentation-only slice unless separately requested.

---

## 2. ROMA Core Responsibilities

| # | Responsibility |
|---|----------------|
| R1 | Maintain **module/subsystem registry** (enabled modules, contract versions, stewards) |
| R2 | Sync **system inventory** (routes, APIs, roles, AI entries, mobile screens) |
| R3 | Delegate **run plan construction** to **ROMA Intelligence** (Planner, Priority, Risk, Regression, Coverage); Core validates tier, credentials, and blocking policy |
| R4 | Enforce **credential profile** resolution (ADR-0003) |
| R5 | Coordinate subsystem lifecycle: `plan → execute → collect → verdict` |
| R6 | Assign global **`run_id`** and artifact index |
| R7 | Apply **blocking policy** (ADR-0002) at aggregation time |
| R8 | Compute **PQS** from canonical weights (ADR-0001) |
| R9 | Emit **DOMAIN_VERDICT_BOARD** and **RELEASE_VERDICT** |
| R10 | Hand off artifacts to **ROMA Learning** post-run |

### Core does not

- Author Playwright/XCTest scenarios
- Mutate product code or production data
- Override council CONDITIONAL GO decisions
- Store secrets

### Intelligence delegation (Stage 2+)

Core **does not** select individual tests. On each run:

1. Core syncs inventory and passes `change_set`, `tier`, `trigger_context` to Intelligence.
2. Intelligence returns `run_plan.json` (tests to run/skip, environments, estimates) per `ROMA_DECISION_PIPELINE.md`.
3. Core resolves credential profiles (ADR-0003) and executes subsystem `plan → execute → collect → verdict`.
4. Post-run, Core passes artifacts to Intelligence for coverage update, learning, confidence, and reports.

See `docs/roma/intelligence/` and ADR-0007.

---

## 3. Module Registry Concept

Each subsystem registers a **module record**:

```yaml
module_id: WEB
contract_version: "1.0"
steward: web-platform
enabled: true
tiers: [T0, T1, T2]
domains_contributed: [PUBLIC_SITE_READY, DASHBOARD_READY]
legacy_adapters:
  - pilot-e2e-audit.yml
  - tests/e2e/
dependencies: [CORE, BCK]
artifact_subdir: web/
```

Registry file (future): `docs/roma/registry/subsystems.yaml`

**Onboarding:** New modules append a record + ADR if contract-breaking + glossary entry + merge tracker note.

---

## 4. Test Execution Tiers

Aligned with `ROMA_EXECUTION_MODEL.md`; operational summary:

| Tier | Name | Duration target | Trigger | Subsystems (typical) |
|------|------|-----------------|---------|---------------------|
| **T0** | Fast PR / deploy smoke | ≤10 min | PR CI tail, post-deploy staging | CORE schema, SEC partial, BCK health, REL prereq |
| **T1** | Targeted module checks | ≤45 min | PR advisory, nightly | T0 + WEB public/auth sample, BCK contracts, A11Y core |
| **T2** | Full staging QA | ≤3 h | Pre-release council | T1 + DB, AI, IOS, AND, role matrix |
| **T3** | Nightly / deep QA | ≤2 h chaos window | Weekly, major release | T2 subset + CHS + OBS deep |

Tier selection is deterministic from `trigger_context` + council profile — not operator guesswork.

---

## 5. Severity Model

| Severity | Meaning | Release impact (ADR-0002) |
|----------|---------|---------------------------|
| **P0** | Release blocker; existential or core journey broken | Blocks GO |
| **P1** | Must fix before expansion / GA | CONDITIONAL GO only with council approval |
| **P2** | Backlog; non-blocking | Warning |
| **P3** | Optional / cosmetic | Informational |

**Risk class R0–R4** maps per `ROMA_REPORTING_MODEL.md` §8; R0 always elevates to P0.

---

## 6. Evidence Model

Every finding links one or more evidence artifacts:

| Evidence type | Format | When required |
|---------------|--------|---------------|
| Screenshot | PNG/WebP | UI failures, design/a11y |
| Trace | Playwright zip, HAR | Intermittent failures |
| Log | text/JSON | Subsystem errors, OBS correlation |
| Network request | HAR entry / summary | BCK contract violations |
| API response | Redacted JSON | Schema/auth failures |
| Build output | CI log excerpt | REL prereq failures |
| Mobile build artifact | JUnit XML, XCTest | IOS/AND modules |

**Invalid verdict:** finding without `evidence_refs[]` → rejected by Core at collect phase.

---

## 7. Verdict Model

| Verdict | Meaning | PQS score factor |
|---------|---------|------------------|
| **YES** | Evidence supports readiness | 1.0 |
| **NO** | Evidence supports failure | 0.0 |
| **UNKNOWN** | Insufficient evidence | 0.3 (default penalty) |
| **SKIPPED_WITH_REASON** | Subsystem not run (missing creds, infra) | Maps to **UNKNOWN** at domain level |

Rules:

- No PASS/FAIL synonyms in council-facing output.
- Worst-slice-wins within subsystem unless council configures critical-slice override.
- `SKIPPED_WITH_REASON` must include `skip_reason` string in subsystem report.

---

## 8. ROMA Artifact Policy

Per ADR-0006:

| Artifact | Location |
|----------|----------|
| Governance docs | `docs/roma/` |
| Run output | `docs/qa/runs/{run_id}/` |
| Inventory baseline | `docs/roma/inventory/` |
| Registry | `docs/roma/registry/` |

### Per-run layout (future)

```
docs/qa/runs/{run_id}/
  run_meta.json
  findings.jsonl
  DOMAIN_VERDICT_BOARD.json
  RELEASE_VERDICT.json
  PQS.json
  COUNCIL_BRIEF.md
  subsystem/
    web.json
    bck.json
    ...
  artifacts/
    screenshots/
    traces/
    logs/
```

Retention: 90 days minimum on staging artifacts; council snapshots may be committed to `docs/qa/archive/` by exception.

---

## 9. Report Schema (Summary)

Canonical JSON schemas (Stage 1 exit deliverable 1.4). Field summary:

### `run_meta.json`

`run_id`, `tier`, `trigger`, `env_id`, `git_sha`, `build_stamp`, `inventory_hash`, `pqs_version`, `started_at`, `completed_at`, `profiles_requested[]`, `profiles_resolved[]`

### `findings.jsonl`

One finding record per line — see `ROMA_REPORTING_MODEL.md` §3.

### `RELEASE_VERDICT.json`

`state` (GO | CONDITIONAL_GO | NO_GO | UNKNOWN), `pqs`, `open_p0_count`, `unknown_domains[]`, `blocking_gates[]`, `council_brief_ref`

All reports include `governance_ref` pointing to ADR versions used.

---

## 10. Stable Selector Policy (for future UI automation)

When Stage 2+ implements browser tests under ROMA WEB:

| Priority | Selector strategy |
|----------|-------------------|
| 1 | `data-testid` / `data-roma-id` (preferred for new UI) |
| 2 | Accessible role + name (`getByRole`) |
| 3 | Stable `id` attributes |
| 4 | Text content (locale-sensitive — require locale in manifest) |
| 5 | CSS/XPath (last resort; flagged in manifest for flake review) |

**Locale rule:** selectors must not hardcode single-language strings without `E2E_LOCALE` alignment.

---

## 11. Module Onboarding Rules

1. Submit module record to `subsystems.yaml`.
2. Document owns/does-not-own in `ROMA_SUBSYSTEMS.md`.
3. Implement four contract operations (`plan`, `execute`, `collect`, `verdict`).
4. Map to PQS categories (ADR-0001).
5. Declare tier participation (T0–T3).
6. Add credential profiles required (ADR-0003).
7. Stage 1 participation: may emit UNKNOWN-only until evidence pipeline validated.
8. ADR required for contract version bumps.

---

## 12. Stage 1 Governance Deliverables Checklist

| Deliverable | Status (this commit) |
|-------------|----------------------|
| ADRs 0001–0006 | ✅ |
| Merge tracker aligned | ✅ |
| Core spec (this doc) | ✅ |
| PQS spec | ✅ |
| Registry YAML | ⏳ Stage 1 exit (code) |
| Inventory sync | ⏳ Stage 1 exit (code) |
| JSON schema validation | ⏳ Stage 1 exit (code) |
| Legacy adapter wrappers | ⏳ Stage 1 exit (code) |
| Operator runbook v0 | ⏳ Stage 1 exit |

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-03 | Stage 1 governance spec |
| 1.1 | 2026-07-03 | Intelligence delegation (R3, §2.1) |
