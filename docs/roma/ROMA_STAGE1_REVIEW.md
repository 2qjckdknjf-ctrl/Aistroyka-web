# ROMA Stage 1 — Governance Review

**Document ID:** ROMA-REV-002  
**Version:** 1.0  
**Date:** 2026-07-03  
**Branch:** `feature/roma-qa-framework`  
**Scope:** Stage 1 governance layer (documentation + ADRs). No product code, no Playwright, no package.json changes.

---

## 1. What Was Created

| Artifact | Path |
|----------|------|
| Merge tracker (realigned) | `ROMA_MERGE_TRACKER.md` |
| Core specification | `ROMA_CORE_SPEC.md` |
| PQS operational spec | `ROMA_PROJECT_QUALITY_SCORE.md` |
| ADR-0001 PQS weights | `adr/ADR-0001-PQS-CANONICAL-WEIGHTS.md` |
| ADR-0002 PR blocking | `adr/ADR-0002-PR-BLOCKING-POLICY.md` |
| ADR-0003 Credential profiles | `adr/ADR-0003-CREDENTIAL-PROFILES.md` |
| ADR-0004 Foreman mapping | `adr/ADR-0004-FOREMAN-ROLE-MAPPING.md` |
| ADR-0005 Chaos tenant | `adr/ADR-0005-CHAOS-TENANT-STRATEGY.md` |
| ADR-0006 docs/roma vs docs/qa | `adr/ADR-0006-DOCS-QA-RELATIONSHIP.md` |
| Stage 1 review | `ROMA_STAGE1_REVIEW.md` (this document) |

### Alignment edits

| File | Change |
|------|--------|
| `ROMA_ARCHITECTURE.md` §15 | PQS pointer → ADR-0001 |
| `ROMA_REPORTING_MODEL.md` §6 | PQS pointer → ADR-0001 + PQS spec |

---

## 2. What Was Aligned

| Stage 0 issue | Resolution |
|---------------|------------|
| Merge tracker ≠ roadmap stages | Tracker now mirrors Stages 0–7 + 0R review row |
| PQS weight divergence | ADR-0001 canonical; architecture/reporting defer to it |
| docs/qa relationship | ADR-0006: roma=governance, qa=generated output |
| PR blocking ambiguity | ADR-0002 |
| Credential owner | ADR-0003 (Platform Ops + Security Owner) |
| Foreman role | ADR-0004 maps to `admin` / project-scoped MANAGER |
| Chaos tenant | ADR-0005 dedicated `roma-fixture-chaos-*` staging only |

---

## 3. ADR Summary

| ADR | Decision (one line) |
|-----|---------------------|
| 0001 | PQS v1: 10 categories, weights sum 100, UNKNOWN penalty 0.3 |
| 0002 | PR blocked by existing CI; ROMA T1 advisory; release blocked by R0/PQS/gates |
| 0003 | Named profiles, env var refs only, skip → UNKNOWN |
| 0004 | Foreman = admin without owner powers |
| 0005 | Chaos only on staging chaos fixtures, never prod |
| 0006 | docs/roma governance vs docs/qa run output |

---

## 4. Stage 1 Roadmap Exit — Open Items

Per `ROMA_ROADMAP.md` §4, these **code** deliverables remain for full Stage 1 exit (not in this governance commit):

| # | Deliverable | Status |
|---|-------------|--------|
| 1.1 | Subsystem registry YAML | NOT STARTED |
| 1.2 | Inventory sync → `docs/roma/inventory/` | NOT STARTED |
| 1.3 | Artifact dir convention | Documented in Core spec |
| 1.4 | JSON schema validation | NOT STARTED |
| 1.5 | Legacy adapter wrappers | NOT STARTED |
| 1.6 | `roma-self-audit` command | NOT STARTED |
| 1.7 | Operator runbook v0 | NOT STARTED |

These may proceed in parallel with Stage 2 or as immediate follow-up — governance no longer blocks design.

---

## 5. Remaining Questions

| # | Question | Owner | Blocks Stage 2? |
|---|----------|-------|-----------------|
| Q1 | Council formal ratification of ADR-0001 weights | Release Council | No |
| Q2 | Exact `ROMA_*` env var migration from legacy `E2E_*` | Platform Ops | No |
| Q3 | Subsystem steward names (email/team) | Eng lead | No |
| Q4 | When to enable ROMA T0 in PR CI | Council | No |
| Q5 | Chaos fixture tenant provisioning on staging | Platform Ops | Yes for Stage 6 only |

---

## 6. Validation Performed

| Check | Result |
|-------|--------|
| All Stage 1 docs exist under `docs/roma/` | ✅ |
| No `package.json` modified | ✅ |
| No `docs/qa/` committed | ✅ |
| No `scripts/qa/` or `apps/web/tests/qa/` committed | ✅ |
| ADR index (6 files) | ✅ |
| Merge tracker matches roadmap | ✅ |

Product tests not run (documentation-only stage).

---

## 7. Stage 2 Readiness Assessment

**Stage 2 scope:** Web + Backend + Security adapters.

| Prerequisite | Ready? |
|--------------|--------|
| Canonical PQS | ✅ ADR-0001 |
| PR/release policy | ✅ ADR-0002 |
| Credential vocabulary | ✅ ADR-0003 |
| docs/qa boundary | ✅ ADR-0006 |
| Core contract spec | ✅ ROMA_CORE_SPEC |
| Artifact layout defined | ✅ |
| Stage 1 runtime (registry/adapters) | ⏳ Optional parallel work |

**Governance layer is sufficient for Stage 2 adapter design and implementation to begin.**

---

## 8. Final Verdict

```
ROMA_STAGE1_READY_FOR_STAGE2 = YES
```

**Caveat:** Full **Stage 1 exit** per roadmap (T0 run from adapters, JSON schema) remains incomplete — track in merge tracker Stage 1 `notes`. Stage 2 work should not duplicate governance; reference ADRs and Core spec only.

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-03 | Stage 1 governance review |
