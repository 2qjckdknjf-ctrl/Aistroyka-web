# ROMA Memory Model

**Document ID:** ROMA-INT-CORE-004  
**Version:** 1.0  
**Date:** 2026-07-03  
**Status:** Stage 2A Architecture (design only)  
**Parent:** `ROMA_INTELLIGENCE_CORE.md`

---

## 1. Purpose

Defines **long-term engineering memory** — what ROMA retains across runs to improve reasoning without storing secrets or mutating product code.

Memory is **institutional engineering knowledge**, not a chat log. It feeds Reasoning, Risk, Regression, and Feedback models.

---

## 2. Responsibilities

| Owns | Does not own |
|------|--------------|
| Memory taxonomy and retention policy | Production databases |
| `memory_store` layout and access rules | User PII from pilot intake |
| Recall interfaces for engines | Credential vaults |
| Decay and deduplication rules | Auto-remediation of code |

---

## 3. Memory Categories

ROMA stores only engineering knowledge:

| Category ID | Contents | Source runs |
|-------------|----------|-------------|
| `MEM-DEFECT` | Historical defects (id, module, severity, resolution) | T1–T3 findings |
| `MEM-REGRESS` | Regression events (introduced_in_sha, fixed_in_sha) | Regression + Learning |
| `MEM-RECUR` | Recurring failures (signature, count, last_seen) | Learning Engine |
| `MEM-FLAKE` | Flaky tests (quarantine status, flake rate) | LRN quarantine |
| `MEM-ADR` | Architecture decisions affecting QA (ADR refs, boundaries) | Manual + inventory |
| `MEM-QUALITY` | Quality trends (PQS, domain verdicts over time) | REL outputs |
| `MEM-RELEASE` | Release history (verdict, confidence, blockers) | Council runs |
| `MEM-PERF` | Performance regressions (metric, baseline, delta) | PERF adapter |

**Explicitly excluded:** secrets, credentials, API keys, raw pilot client PII, full prompt logs with sensitive content.

---

## 4. Memory Record Schema

```json
{
  "memory_id": "MEM-{category}-{hash}",
  "category": "MEM-RECUR",
  "subject_ref": "WEB/dashboard/projects",
  "signature": "stable-finding-or-test-id",
  "facts": { "occurrence_count": 5, "last_run_id": "..." },
  "confidence": 0.85,
  "first_seen": "ISO8601",
  "last_seen": "ISO8601",
  "ttl_days": null,
  "recommendations": ["Increase T1 depth on module X"],
  "evidence_refs": ["docs/qa/runs/.../findings.jsonl#..."],
  "redaction_level": "engineering"
}
```

---

## 5. Inputs

| Input | Source |
|-------|--------|
| Run findings | `findings.jsonl` |
| Reasoning outcomes | High-signal `reasoning_trace` |
| Decision outcomes | Feedback Model (predicted vs actual) |
| ADR registry | `docs/roma/adr/` |
| Release verdicts | `RELEASE_VERDICT.json` |
| Steward annotations | Manual memory ingest (gated) |

---

## 6. Outputs

| Output | Consumer |
|--------|----------|
| `memory_recall(query)` | Risk, Regression, Reasoning |
| `memory_delta.json` | Per-run append log |
| `memory_recommendations[]` | Decision Engine, Executive reports |
| `module_stability_index` | Release Model, Risk Model |

Storage (future): `docs/roma/memory/` or service-role DB — never in product repo secrets.

---

## 7. Interfaces

| Interface | Partner | Contract |
|-----------|---------|----------|
| Learning Engine (Stage 2) | Implements MEM-* ingestion | `ROMA_LEARNING_ENGINE.md` |
| Feedback Model | Updates confidence on outcomes | `ROMA_FEEDBACK_MODEL.md` |
| Reasoning Model | Recalls RECUR/REGRESS for Q4–Q5 | `failure_probability` boost |
| Risk Model | Stability index → risk factor | `ROMA_RISK_MODEL.md` |

---

## 8. Retention and Decay

| Rule | Policy |
|------|--------|
| MEM-RECUR | Retain until 3 consecutive clean runs, then decay to advisory |
| MEM-FLAKE | Retain while quarantined; archive after 90d clean |
| MEM-RELEASE | Retain indefinitely (compressed yearly) |
| MEM-PERF | Retain 180d rolling baseline window |
| Low-confidence (<0.3) | Auto-expire after 60d unless reconfirmed |

---

## 9. Future Extensions

- Vector recall for similar failure signatures (optional, council-gated)
- Cross-tenant anonymized pattern sharing (platform owner only)
- Memory export for postmortems (redacted bundle)
- Link MEM-ADR to architecture drift alerts

---

## 10. Open Questions

| ID | Question |
|----|----------|
| Q1 | File-based `docs/roma/memory/` vs Supabase service table for scale? |
| Q2 | Who can author manual MEM-ADR entries — architecture owner only? |
| Q3 | Memory poisoning guardrails if bad finding ingested? |

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-03 | Stage 2A memory model |
