# ROMA — Implementation Roadmap

**Document ID:** ROMA-ROAD-001  
**Version:** 1.0  
**Date:** 2026-07-03  
**Parent:** `ROMA_ARCHITECTURE.md`

---

## 1. Purpose

Stages ROMA from architecture to operational platform **without prescribing implementation code in this document**. Each stage has entry criteria, deliverables, exit verdict, and explicit non-goals.

*This roadmap is QA-platform scope — independent of AISTROYKA product roadmap phases but must respect customer-finance and tenant-isolation invariants.*

---

## 2. Roadmap Overview

```
Stage 0 — Architecture (current)
    ↓
Stage 1 — Core + Inventory + Reporting skeleton
    ↓
Stage 2 — Web + Backend + Security adapters
    ↓
Stage 3 — Database + RBAC + AI adapters
    ↓
Stage 4 — Mobile (iOS + Android) integration
    ↓
Stage 5 — Performance + Accessibility depth
    ↓
Stage 6 — Observability + Chaos + Learning maturity
    ↓
Stage 7 — Council automation + dashboard (optional)
```

Estimated calendar duration depends on team allocation; architecture assumes **incremental value per stage** — no big-bang.

---

## 3. Stage 0 — Architecture Baseline ✅

### Deliverables
- `docs/roma/ROMA_*.md` (7 documents)
- Subsystem boundaries, execution model, reporting model
- Legacy adapter mapping documented

### Exit criteria
- Architecture review approved by engineering lead + release council chair
- No unresolved R0 architecture conflicts

### Status
**COMPLETE** (this delivery)

---

## 4. Stage 1 — Foundation (ROMA Core)

### Goals
Establish orchestration skeleton, inventory pipeline, artifact layout, and verdict schema **without** rewriting existing tests.

### Deliverables
| # | Deliverable |
|---|-------------|
| 1.1 | ROMA Core registry (subsystem manifest YAML) |
| 1.2 | Inventory sync job → `docs/roma/inventory/routes.json` |
| 1.3 | Run artifact directory convention `docs/roma/runs/{run_id}/` |
| 1.4 | Finding record + DOMAIN_VERDICT_BOARD JSON schema (validated) |
| 1.5 | Legacy adapter wrappers: pilot-smoke, ci-check, ai_live_provider |
| 1.6 | `roma-self-audit` command producing COVERAGE_REPORT |
| 1.7 | Operator runbook v0 |

### Entry criteria
- Stage 0 approved
- Secret profile names agreed (not values)

### Exit criteria
- One full T0 run produces valid `RELEASE_VERDICT.json` from adapters only
- All subsystem slots emit UNKNOWN or YES/NO — no invalid states
- Council accepts PQS v1 weights

### Non-goals
- New Playwright specs
- Mobile device lab
- Chaos scenarios
- QA dashboard UI

### Risks
- Adapter drift if legacy scripts change without registry update → mitigate via inventory hash in CI

---

## 5. Stage 2 — Web + Backend + Security

### Goals
Unify public/dashboard validation and API contract monitoring under ROMA contracts.

### Deliverables
| # | Deliverable |
|---|-------------|
| 2.1 | ROMA WEB adapter (absorb `tests/e2e`, `tests/qa` under manifest) |
| 2.2 | ROMA BCK network monitor + contract registry |
| 2.3 | ROMA SEC sensitive endpoint catalog + finance denylist integration |
| 2.4 | Multi-browser/viewport matrix policy (tier-gated) |
| 2.5 | T1 PR gate advisory comment with DOMAIN_VERDICT_BOARD |
| 2.6 | Stakeholder profile integration for portal slices |

### Exit criteria
- T1 nightly on staging: PUBLIC_SITE, SECURITY, BACKEND domains ≠ UNKNOWN
- R0 stakeholder finance test wired when `stakeholder_smoke` profile present
- Coverage COV-API ≥ 50% on T1 (stretch)

### Non-goals
- Full 287-route API sweep every PR
- Visual regression baseline approval workflow

---

## 6. Stage 3 — Database + RBAC + AI

### Goals
Prove data consistency, role matrix, and AI LIVE governance.

### Deliverables
| # | Deliverable |
|---|-------------|
| 3.1 | ROMA DB fixture lifecycle + sync scenarios |
| 3.2 | ROMA RBAC matrix manifest (role × route × action) |
| 3.3 | ROMA AI adapter: live/fallback/disabled classification |
| 3.4 | Tenant leakage probes (AI + DB cross-tenant negative tests) |
| 3.5 | T2 pre-release council runbook |
| 3.6 | COV-RBAC initial baseline |

### Exit criteria
- TENANT_ISOLATION_READY and RBAC_READY ≠ UNKNOWN on T2 staging
- AI_READY = YES requires `require-live` pass when AI code changed
- DB CRUD round-trip evidence on fixture tenant

### Non-goals
- Production DB mutation
- Full AI eval harness (phase-e brain) — probe layer only

---

## 7. Stage 4 — Mobile Integration

### Goals
Bring iOS and Android under same release verdict board.

### Deliverables
| # | Deliverable |
|---|-------------|
| 4.1 | ROMA IOS adapter (UITest + Layer B optional) |
| 4.2 | ROMA AND adapter (instrumented + API chain) |
| 4.3 | Shared scenario ID map (worker report → manager sees) |
| 4.4 | Mobile slice in PQS (already weighted) activated |
| 4.5 | PR path: ios/ → IOS T1; android/ → AND T2 manual |

### Exit criteria
- MOBILE_IOS_READY = YES on T2 when ios/ unchanged ≥1 release cycle
- MOBILE_ANDROID_READY = YES or documented UNKNOWN with council acceptance
- Cross-surface scenario `J3` (worker report → manager UI) green on staging

### Non-goals
- Store upload automation (remains owner-gated MODE B)
- Android parity with iOS depth (per product strategy)

---

## 8. Stage 5 — Performance + Accessibility

### Goals
Budget enforcement and a11y regression detection on critical paths.

### Deliverables
| # | Deliverable |
|---|-------------|
| 5.1 | PERF budget profiles per environment |
| 5.2 | Baseline run comparison (regression > X% → P1) |
| 5.3 | A11Y rule catalog for public + dashboard critical paths |
| 5.4 | Mobile a11y smoke (iOS/Android shell screens) |
| 5.5 | PERFORMANCE_REPORT + ACCESSIBILITY_REPORT automation |

### Exit criteria
- PERF and A11Y domains YES on T2 for two consecutive weekly runs
- Council-approved budgets documented in ADR

---

## 9. Stage 6 — Observability + Chaos + Learning Maturity

### Goals
Close the loop: prove deploy SHA, inject faults safely, learn from trends.

### Deliverables
| # | Deliverable |
|---|-------------|
| 6.1 | OBS deployment proof gate on every T0 |
| 6.2 | CHS staging scenario catalog (≥3 scenarios) |
| 6.3 | LRN debt register + flake quarantine workflow |
| 6.4 | Quarterly quality trend report template |
| 6.5 | Coverage debt SLA (e.g., R4 → P2 if untested >90 days) |

### Exit criteria
- Zero T0 runs without build_stamp match
- CHS run produces recovery metrics without fixture corruption
- LRN recommendations referenced in two consecutive council briefs

---

## 10. Stage 7 — Council Automation (Optional)

### Goals
Reduce manual council friction; optional read-only dashboard.

### Deliverables
| # | Deliverable |
|---|-------------|
| 7.1 | Release council workflow_dispatch consuming RELEASE_VERDICT.json |
| 7.2 | Read-only QA dashboard (static site or internal page) |
| 7.3 | PR bot: PQS delta comment |
| 7.4 | Auto-block deploy on R0 (configurable) |

### Exit criteria
- Council median decision time reduced (metric TBD)
- No dashboard without auth on sensitive findings

---

## 11. Dependencies on AISTROYKA Product

| Product state | ROMA stage blocked? |
|---------------|---------------------|
| Staging unstable | Stage 2+ flaky — fix deploy first |
| No stakeholder smoke account | SEC finance slice UNKNOWN |
| No pilot E2E creds | Dashboard UNKNOWN |
| iOS Layer B creds missing | IOS deep UNKNOWN |
| AI provider keys missing | AI_READY UNKNOWN (not NO) |

---

## 12. Success Metrics (Platform KPIs)

| KPI | Target (12 months post Stage 1) |
|-----|--------------------------------|
| R0 escaped to prod | 0 |
| Median time to detect staging regression | < 24h (nightly) |
| DOMAIN UNKNOWN count on T2 council run | ≤ 3 domains |
| PQS on council GO runs | ≥ 85 |
| Coverage debt items > 90 days | Decreasing QoQ |
| Flake quarantine rate | < 5% of runs |

---

## 13. Governance Checkpoints

| Checkpoint | When | Participants |
|------------|------|--------------|
| Architecture sign-off | Stage 0 complete | Eng lead, QA arch, security |
| Stage gate review | Each stage exit | Subsystem stewards + council chair |
| PQS weight review | Quarterly | Council |
| Chaos prod policy | Never — annual reaffirmation | Security owner |

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-03 | Initial roadmap |
