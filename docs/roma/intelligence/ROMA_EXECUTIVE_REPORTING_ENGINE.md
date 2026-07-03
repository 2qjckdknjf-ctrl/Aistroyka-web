# ROMA Executive Reporting Engine

**Document ID:** ROMA-INT-007  
**Version:** 1.0  
**Date:** 2026-07-03  
**Parent:** `ROMA_INTELLIGENCE.md`

---

## 1. Purpose

Produces **audience-specific reports** from the same evidence base — each with summary, risks, evidence, recommendations, and confidence.

---

## 2. Report Audiences

| Audience | Report ID | Primary focus |
|----------|-----------|---------------|
| Developer | `RPT-DEV` | Diff impact, failures, repro artifacts |
| QA | `RPT-QA` | Coverage debt, flakes, plan vs actual |
| Security | `RPT-SEC` | R0/R1, finance isolation, exposure |
| AI | `RPT-AI` | LIVE/FALLBACK, leakage, provider health |
| Architecture | `RPT-ARCH` | Graph impact, module stability, ADR triggers |
| Executive | `RPT-EXEC` | Confidence %, GO/NO-GO, trend |

---

## 3. Report Template (all audiences)

| Section | Required content |
|---------|------------------|
| **Summary** | 3–5 sentences; verdict + confidence |
| **Top risks** | Ranked RT-Critical / High (max 10) |
| **Evidence** | Links to `docs/qa/runs/{run_id}/` artifacts |
| **Recommendations** | From Learning Engine (no auto-actions) |
| **Confidence** | Release Confidence % + PQS |

---

## 4. Audience Customization

### Developer (`RPT-DEV`)

- Changed modules → regression forecast  
- Failed slices with trace/screenshot links  
- Skip reasons affecting their area  
- Suggested local repro commands (future runbook refs)

### QA (`RPT-QA`)

- Plan vs executed vs skipped  
- New vs repeated failures  
- Coverage dimension deltas  
- Flake quarantine list  

### Security (`RPT-SEC`)

- R0/R1 findings header  
- Stakeholder finance probe results  
- Sensitive endpoint probe summary  
- Tenant isolation signals  

### AI (`RPT-AI`)

- LIVE vs FALLBACK classification  
- Provider errors, quota, circuit breaker  
- Leakage probe results (redacted)  
- Copilot/stream scenario coverage  

### Architecture (`RPT-ARCH`)

- Knowledge graph impact radius of diff  
- Module stability index changes  
- Subsystem contract version drift  
- ADR amendment recommendations  

### Executive (`RPT-EXEC`)

- Release Confidence % and state  
- PQS trend (last 5 runs)  
- GO / CONDITIONAL / NO-GO one-liner  
- Top 3 business risks in plain language  

---

## 5. Inputs

All engines: Risk manifest, run results, Coverage map, Learning delta, Confidence JSON, PQS, `COUNCIL_BRIEF.md` base.

---

## 6. Outputs

| Path | Format |
|------|--------|
| `docs/qa/runs/{run_id}/reports/RPT-*.md` | Markdown |
| `docs/qa/runs/{run_id}/reports/reports_index.json` | Machine index |

---

## 7. Rationale

One truth, many lenses — avoids duplicate contradictory reports per team.

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-03 | Initial executive reporting spec |
