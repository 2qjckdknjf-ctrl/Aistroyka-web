# ROMA — Reporting Model

**Document ID:** ROMA-REP-001  
**Version:** 1.0  
**Date:** 2026-07-03  
**Parent:** `ROMA_ARCHITECTURE.md`

---

## 1. Purpose

Defines how ROMA produces, aggregates, and presents quality evidence: finding records, subsystem reports, domain verdicts, Project Quality Score (PQS), release readiness, risk classification, and coverage metrics.

---

## 2. Reporting Hierarchy

```
Level 0 — Raw Artifacts
    screenshots, traces, videos, HAR, JUnit, XCTest XML, logs, JSON payloads
         │
Level 1 — Finding Records (normalized)
    stable ID, severity, subsystem, persona, evidence_refs
         │
Level 2 — Subsystem Report
    findings grouped by slice; subsystem verdict
         │
Level 3 — Domain Verdict Board
    YES / NO / UNKNOWN per release domain
         │
Level 4 — Project Quality Score (PQS)
    weighted 0–100 composite
         │
Level 5 — Release Readiness Verdict
    GO | CONDITIONAL GO | NO-GO | UNKNOWN
         │
Level 6 — Council Brief
    human narrative + P0/P1/P2 + recommendations
         │
Level 7 — Learning Ingest
    trends, debt register, flake registry
```

*Rationale:* Separation allows machines to gate (L3–L5) while humans decide policy (L6).

---

## 3. Finding Record Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `finding_id` | string | yes | `ROMA-{SUB}-{CAT}-{nnn}` |
| `run_id` | string | yes | Global correlation |
| `subsystem` | enum | yes | CORE, WEB, … |
| `slice` | string | yes | e.g. `WEB-public`, `AI-copilot` |
| `severity` | enum | yes | P0, P1, P2, P3 |
| `risk_class` | enum | yes | R0–R4 |
| `status` | enum | yes | confirmed, suspected, gap |
| `persona` | string | no | Acting profile |
| `environment` | string | yes | staging, prod, … |
| `build_stamp` | string | yes | Deploy SHA proof |
| `message` | string | yes | Human-readable |
| `evidence_refs` | array | yes | Artifact paths/URLs |
| `remediation_hint` | string | no | Non-binding suggestion |

### Severity definitions

| Severity | Meaning | Typical council action |
|----------|---------|------------------------|
| **P0** | Blocks release; existential or core journey | Immediate fix |
| **P1** | Major regression; workaround may exist | Fix before GA |
| **P2** | Minor; scheduled fix | Backlog |
| **P3** | Cosmetic / doc | Optional |

---

## 4. Subsystem Report Structure

Each subsystem emits:

```yaml
subsystem: WEB
run_id: roma-20260703-abc1234-001
slices:
  - id: WEB-public
    verdict: YES | NO | UNKNOWN
    findings_count: { P0: 0, P1: 1, P2: 3, P3: 0 }
    evidence_bundle: docs/roma/runs/.../web/
  - id: WEB-dashboard
    verdict: UNKNOWN
    skip_reason: "credential profile pilot_owner unresolved"
verdict: NO   # worst-slice-wins unless council configures override
generated_at: ISO8601
```

### Verdict aggregation within subsystem

**Default rule:** worst slice wins (`NO` > `UNKNOWN` > `YES`).

**Override:** council may configure "critical slices only" for aggregate subsystem verdict.

---

## 5. Domain Verdict Board

Maps to release council questions. Each domain is **independent** — one UNKNOWN does not inflate another.

| Domain key | Subsystems primary | Verdict source |
|------------|-------------------|----------------|
| `PUBLIC_SITE_READY` | WEB (public) | WEB-public slice |
| `DASHBOARD_READY` | WEB (dashboard), BCK | WEB-dashboard + BCK auth |
| `MOBILE_IOS_READY` | IOS | IOS aggregate |
| `MOBILE_ANDROID_READY` | AND | AND aggregate |
| `BACKEND_READY` | BCK | BCK aggregate |
| `DATABASE_READY` | DB | DB aggregate |
| `AI_READY` | AI | AI LIVE classification |
| `SECURITY_READY` | SEC | SEC aggregate; R0=0 required for YES |
| `ACCESSIBILITY_READY` | A11Y | A11Y aggregate |
| `PERFORMANCE_READY` | PERF | PERF budget pass |
| `TENANT_ISOLATION_READY` | DB, SEC, AI | Cross-cutting R0 gate |
| `RBAC_READY` | WEB, BCK, SEC | Role matrix slices |
| `CI_READY` | REL prereq | ci-check + roma CI |
| `RELEASE_READY` | REL | Aggregated council verdict |
| `OBSERVABILITY_READY` | OBS | deployment proof |

Display values: **YES** | **NO** | **UNKNOWN** only. No PASS/FAIL synonyms in council brief.

---

## 6. Project Quality Score (PQS)

> **Canonical source:** `docs/roma/adr/ADR-0001-PQS-CANONICAL-WEIGHTS.md` and `ROMA_PROJECT_QUALITY_SCORE.md`.  
> Informal tables in this document are superseded by ADR-0001.

Weighted composite (0–100). Scoring: YES = full weight, UNKNOWN = 30% (configurable), NO = 0.

See `ROMA_PROJECT_QUALITY_SCORE.md` for category table, thresholds, and examples.

---

## 7. Release Readiness Model

### 7.1 States

| State | Definition |
|-------|------------|
| **GO** | All blocking gates YES; PQS ≥ threshold; R0 = 0 |
| **CONDITIONAL GO** | Known P1s with council approval + mitigations |
| **NO-GO** | Any R0, or PQS < floor, or critical domain NO |
| **UNKNOWN — INSUFFICIENT EVIDENCE** | Required profiles/envs missing |

### 7.2 Blocking gate catalog (default)

| Gate ID | Condition | Tier |
|---------|-----------|------|
| G-R0 | Zero R0 open findings | T0+ |
| G-STAGING-SMOKE | T0 staging deploy smoke pass | T0 |
| G-BUILD-STAMP | OBS deployment proof matches intended SHA | T0 |
| G-SECURITY-HEADERS | SEC prod headers (when prod promotion) | T0 |
| G-FINANCE-ISOLATION | Stakeholder denylist (when prod promotion) | T0 |
| G-PQS-FLOOR | PQS ≥ 70 | T2 |
| G-AI-LIVE | AI_READY YES when AI routes changed | T2 |
| G-MOBILE-IOS | IOS UITest pass when ios/ changed | T1 |
| G-CI-CHECK | PR merge gate pass | T1 |

Council can promote advisory gates to blocking via ADR.

### 7.3 CONDITIONAL GO requirements

Must document:

- Approved P1 list with owners and dates  
- Mitigations in production (feature flags, monitoring)  
- Expiry date for CONDITIONAL status  
- Elevated OBS watch window  

---

## 8. Risk Model (Reporting View)

| Risk class | Reporting rule |
|------------|----------------|
| **R0** | Auto P0; appears in council brief header |
| **R1** | P0 or P1 based on blast radius config |
| **R2** | P1/P2 |
| **R3** | P2/P3 |
| **R4** | Logged to LRN only unless trend threshold hit |

**Risk score (advisory):** `severity_weight × blast_radius × (1 - evidence_confidence)`

Used for prioritization in Learning reports, not sole release input.

---

## 9. Coverage Model (Reporting View)

Coverage reported separately from verdicts — **never implies YES**.

### 9.1 Metrics

| Metric ID | Formula | Source |
|-----------|---------|--------|
| `COV-PAGE` | exercised_pages / inventory_pages | CORE inventory |
| `COV-API` | probed_routes / inventory_routes | BCK manifest |
| `COV-RBAC` | tested_role_actions / matrix_role_actions | SEC + WEB |
| `COV-AI` | tested_ai_entries / catalog_ai_entries | AI |
| `COV-MOBILE-SCREEN` | tested_screens / inventory_screens | IOS + AND |

### 9.2 Coverage report sections

1. Summary percentages  
2. Untested inventory (top N by risk)  
3. Delta vs previous run  
4. Debt register linkage  

---

## 10. Report Artifacts (Per Run)

| Artifact | Format | Owner |
|----------|--------|-------|
| `findings.jsonl` | JSONL | CORE |
| `subsystem/*.json` | JSON | each subsystem |
| `DOMAIN_VERDICT_BOARD.json` | JSON | REL |
| `RELEASE_VERDICT.json` | JSON | REL |
| `COUNCIL_BRIEF.md` | Markdown | REL |
| `PQS.json` | JSON | REL |
| `COVERAGE_REPORT.md` | Markdown | LRN |
| `BACKEND_REPORT.md` | Markdown | BCK |
| `SECURITY_REPORT.md` | Markdown | SEC |
| `AI_REPORT.md` | Markdown | AI |
| `PERFORMANCE_REPORT.md` | Markdown | PERF |
| `ACCESSIBILITY_REPORT.md` | Markdown | A11Y |
| `LEARNING_DELTA.md` | Markdown | LRN |

### Future: QA Dashboard

Read-only UI consuming `RELEASE_VERDICT.json` + trend store. Not required for Stage 1.

---

## 11. CI and Operator Consumption

| Consumer | Reads | Action |
|----------|-------|--------|
| GitHub PR check | T1 subsystem JSON + PQS | Comment / status (advisory default) |
| Deploy workflow | T0 DOMAIN_VERDICT | Block/continue |
| Release council | COUNCIL_BRIEF.md | GO/NO-GO vote |
| Engineering | LEARNING_DELTA.md | Sprint input |
| Security owner | SECURITY_REPORT.md | R0 triage |

---

## 12. UNKNOWN Handling in Reports

Reports MUST include:

- `unknown_domains[]` with reason per domain  
- `missing_profiles[]`  
- `skipped_subsystems[]`  
- Explicit statement: **"UNKNOWN is not approval"**

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-03 | Initial reporting model |
