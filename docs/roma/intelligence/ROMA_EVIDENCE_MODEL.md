# ROMA Evidence Model

**Document ID:** ROMA-INT-010  
**Version:** 1.0  
**Date:** 2026-07-03  
**Parent:** `ROMA_INTELLIGENCE.md`

---

## 1. Purpose

Defines **what constitutes valid evidence** for findings, verdicts, and confidence — extending `ROMA_CORE_SPEC.md` §6 with intelligence-layer requirements.

---

## 2. Evidence Types

| Type ID | Format | Required when |
|---------|--------|---------------|
| `EV-SCREEN` | PNG/WebP | UI failure, design/a11y |
| `EV-TRACE` | Playwright zip, HAR | Intermittent failure |
| `EV-LOG` | text/JSON | Subsystem crash, OBS |
| `EV-NET` | HAR entry, request/response summary | BCK 4xx/5xx |
| `EV-API` | Redacted JSON body | Schema/auth failure |
| `EV-BUILD` | CI log excerpt | REL prereq fail |
| `EV-MOBILE` | JUnit, XCTest XML | IOS/AND |
| `EV-DIFF` | Git sha, file list | Risk/regression rationale |
| `EV-STAMP` | buildStamp from health | Deploy proof |
| `EV-GRAPH` | impact_radius export | Architecture report |

---

## 3. Evidence Quality Rules

| Rule ID | Rule |
|---------|------|
| E-01 | No finding without ≥1 `evidence_ref` |
| E-02 | R0 findings require ≥2 evidence types when possible |
| E-03 | AI evidence must redact prompts and secrets |
| E-04 | Finance isolation evidence must use stakeholder profile (ADR-0003) |
| E-05 | `EV-STAMP` required on every run for OBS |
| E-06 | Stale evidence (>30d) cannot support YES alone for RT-Critical |

---

## 4. Evidence ↔ Confidence

| Evidence completeness | Max confidence contribution |
|-----------------------|----------------------------|
| Full suite for RT-Critical modules | 100% of component |
| Partial / UNKNOWN slices | 35% per ADR UNKNOWN penalty |
| No evidence (gap) | 0%; `status: gap` in Learning |

---

## 5. Storage Layout

Per `ADR-0006` and Core spec:

```
docs/qa/runs/{run_id}/artifacts/
  screenshots/
  traces/
  logs/
  api/
  mobile/
  evidence_index.json
```

`evidence_index.json` maps `finding_id` → refs.

---

## 6. Interfaces

- **Subsystem adapters:** produce raw artifacts  
- **Core collect:** validates E-01  
- **Release Confidence:** reads evidence completeness metrics  
- **Executive Reporting:** links evidence in all RPT-*  

---

## 7. Rationale

Intelligence engines must not inflate confidence without proof — evidence model enforces fail-closed culture from Stage 0.

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-03 | Initial evidence model |
