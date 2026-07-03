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
Stage 0 — Architecture ✅
    ↓
Stage 1 — Core + Inventory + Reporting skeleton (governance ✅)
    ↓
Stage 2 — Intelligence layer (decision engine) ✅
    ↓
Stage 2A — Intelligence core (how ROMA thinks) ✅
    ↓
Stage 2B — Intelligence schemas + contracts ✅
    ↓
Stage 2C — ROMA OS Kernel & Constitution ✅
    ↓
Stage 2D — Machine schema validation (optional)
    ↓
Stage 3 — QA Application: AISTROYKA Project Adapter + Tool Adapters (WEB/BCK/SEC)
    ↓
Stage 4 — Database + RBAC + AI adapters
    ↓
Stage 5 — Mobile (iOS + Android) integration
    ↓
Stage 6 — Performance + Accessibility depth
    ↓
Stage 7 — Observability + Chaos + Learning maturity
    ↓
Stage 8 — Council automation + dashboard (optional)
```

*Note (2026-07-03): Stage 2 was redefined as ROMA Intelligence (architecture). Former roadmap Stage 2 (WEB/BCK/SEC adapters) is now **Stage 3**. Stages 3–7 renumbered to 4–8 accordingly in section headings below.*

*Note (2026-07-03, Stage 2C): ROMA evolves to **ROMA OS**. Stages 0–2B remain the ROMA QA Application spec. AISTROYKA is the first Project Adapter. Prior “machine schema” scope moved to **Stage 2D**.*

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

## 5. Stage 2 — Intelligence Layer ✅

### Goals
Define the decision brain that controls all future QA subsystems — risk, planning, regression, coverage, learning, release confidence, and executive reporting.

### Deliverables
| # | Deliverable |
|---|-------------|
| 2.1 | `docs/roma/intelligence/` — 13 engine architecture documents |
| 2.2 | `ROMA_DECISION_PIPELINE.md` — end-to-end flow |
| 2.3 | `ROMA_KNOWLEDGE_GRAPH.md` — impact analysis schema |
| 2.4 | `ADR-0007` — recommendation-only boundary |
| 2.5 | `ROMA_STAGE2_REVIEW.md` — stage gate |

### Entry criteria
- Stage 1 governance approved

### Exit criteria
- All intelligence engines documented with inputs, outputs, rationale
- No contradiction with ADRs 0001–0006
- Core spec delegates planning to Intelligence

### Non-goals
- Test implementation (any subsystem)
- Runtime intelligence service
- Knowledge graph auto-extraction

### Status
**COMPLETE** (2026-07-03)

---

## 5A. Stage 2A — Intelligence Core (How ROMA Thinks) ✅

### Goals
Define the cognitive architecture — reasoning, memory, knowledge, feedback, decision synthesis, and lifecycle — as an Engineering Intelligence Platform.

### Deliverables
| # | Deliverable |
|---|-------------|
| 2A.1 | `ROMA_INTELLIGENCE_CORE.md` — platform definition |
| 2A.2 | `ROMA_REASONING_MODEL.md` — nine-question reasoning schema |
| 2A.3 | `ROMA_DECISION_ENGINE.md` — decision bundle synthesis |
| 2A.4 | `ROMA_MEMORY_MODEL.md` — long-term engineering memory |
| 2A.5 | `ROMA_RISK_MODEL.md` — risk ontology |
| 2A.6 | `ROMA_RELEASE_MODEL.md` — release readiness reasoning |
| 2A.7 | `ROMA_KNOWLEDGE_MODEL.md` — system world-model |
| 2A.8 | `ROMA_FEEDBACK_MODEL.md` — prediction calibration |
| 2A.9 | `ROMA_ENGINE_INTERFACES.md` — cognitive ↔ engine contracts |
| 2A.10 | `ROMA_STATE_MACHINE.md` — intelligence lifecycle |
| 2A.11 | `ROMA_STAGE2A_REVIEW.md` — stage gate |

### Exit criteria
- All 10 documents with purpose, I/O, interfaces, extensions, open questions
- Stage 2 engines explicitly implement 2A contracts
- No contradiction with ADR-0007

### Non-goals
- JSON Schema files (Stage 2B)
- Runtime implementation
- ML training

### Status
**COMPLETE** (2026-07-03)

---

## 5B. Stage 2B — Intelligence Schemas + Contracts ✅

### Goals
Formalize Stage 2A/2 interfaces as enforceable contracts: canonical schema docs, conformance matrix, RT-Critical registry, fixtures, T0 reasoning ADR.

### Deliverables
| # | Deliverable |
|---|-------------|
| 2B.1–2B.9 | `docs/roma/schemas/*.schema.md` (9 artifacts) |
| 2B.10 | `ROMA_INTERFACE_CONFORMANCE_MATRIX.md` |
| 2B.11 | `registries/rt-critical-modules.yaml.md` |
| 2B.12 | `fixtures/*.example.json.md` (5 fixtures) |
| 2B.13 | `ADR-0008-T0-REASONING-DEPTH.md` |
| 2B.14 | `ROMA_STAGE2B_REVIEW.md` |

### Exit criteria
- All IF-* interfaces mapped ✅
- Schema docs with validation rules and examples ✅
- RT-Critical registry draft ✅

### Non-goals
- Machine JSON Schema `.json` files (Stage 2D)
- Adapter code

### Status
**COMPLETE** (2026-07-03)

---

## 5C. Stage 2C — ROMA OS Kernel & Constitution ✅

### Goals
Define ROMA as an Engineering Intelligence Operating System: constitution, kernel, applications, adapters, platform services, compatibility with Stages 0–2B.

### Deliverables
| # | Deliverable |
|---|-------------|
| 2C.1 | `docs/roma/os/ROMA_CONSTITUTION.md` |
| 2C.2 | `docs/roma/os/ROMA_OS_ARCHITECTURE.md` |
| 2C.3 | `docs/roma/os/ROMA_KERNEL.md` |
| 2C.4 | `docs/roma/os/ROMA_APPLICATION_MODEL.md` |
| 2C.5 | `docs/roma/os/ROMA_ADAPTER_MODEL.md` |
| 2C.6 | `docs/roma/os/ROMA_PLATFORM_SERVICES.md` |
| 2C.7 | `docs/roma/os/ROMA_COMPATIBILITY_POLICY.md` |
| 2C.8 | `ADR-0009-ROMA-OS-EVOLUTION.md` |
| 2C.9 | `ROMA_STAGE2C_REVIEW.md` |

### Exit criteria
- Constitution + kernel + app/adapter models documented
- QA as first app; AISTROYKA as first Project Adapter stated
- No breaking changes to Stage 0–2B

### Non-goals
- Runtime kernel code
- Tool Adapter implementation
- Mass doc rename

### Status
**COMPLETE** (2026-07-03)

---

## 5D. Stage 2D — Machine Schema Validation

*Former Stage 2C scope (pre-OS evolution).*

### Goals
JSON Schema files, automated fixture validation, schema index.

### Deliverables
| # | Deliverable |
|---|-------------|
| 2C.1 | `docs/roma/schemas/*.schema.json` mirroring `.schema.md` |
| 2C.2 | Fixture validator (conformance script) |
| 2C.3 | `regression_forecast.schema.md` (if needed) |
| 2C.4 | `ROMA_SCHEMA_INDEX.md` |

### Exit criteria
- All Stage 2B fixtures pass machine validation
- Stage 3 adapter onboarding checklist published

---

## 6. Stage 3 — QA Application: AISTROYKA Adapter + WEB/BCK/SEC

*Former roadmap Stage 2 (subsystem adapters), now under ROMA OS Application + Adapter model.*

### Goals
Unify public/dashboard validation and API contract monitoring under ROMA contracts.

### Deliverables
| # | Deliverable |
|---|-------------|
| 3.1 | ROMA WEB adapter (absorb `tests/e2e`, `tests/qa` under manifest) |
| 3.2 | ROMA BCK network monitor + contract registry |
| 3.3 | ROMA SEC sensitive endpoint catalog + finance denylist integration |
| 3.4 | Multi-browser/viewport matrix policy (tier-gated) |
| 3.5 | T1 PR gate advisory comment with DOMAIN_VERDICT_BOARD |
| 3.6 | Stakeholder profile integration for portal slices |
| 3.7 | Intelligence `run_plan` consumer in Core + WEB/BCK/SEC adapters |
| 3.8 | Register ROMA QA app + AISTROYKA Project Adapter with Kernel |

### Exit criteria
- T1 nightly on staging: PUBLIC_SITE, SECURITY, BACKEND domains ≠ UNKNOWN
- R0 stakeholder finance test wired when `stakeholder_smoke` profile present
- Coverage COV-API ≥ 50% on T1 (stretch)

### Non-goals
- Full 287-route API sweep every PR
- Visual regression baseline approval workflow

---

## 7. Stage 4 — Database + RBAC + AI

*Former roadmap Stage 3.*

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

## 8. Stage 5 — Mobile Integration

*Former roadmap Stage 4.*

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

## 9. Stage 6 — Performance + Accessibility

*Former roadmap Stage 5.*

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

## 10. Stage 7 — Observability + Chaos + Learning Maturity

*Former roadmap Stage 6.*

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

## 11. Stage 8 — Council Automation (Optional)

*Former roadmap Stage 7.*

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

## 12. Dependencies on AISTROYKA Product

| Product state | ROMA stage blocked? |
|---------------|---------------------|
| Staging unstable | Stage 3+ flaky — fix deploy first |
| No stakeholder smoke account | SEC finance slice UNKNOWN |
| No pilot E2E creds | Dashboard UNKNOWN |
| iOS Layer B creds missing | IOS deep UNKNOWN |
| AI provider keys missing | AI_READY UNKNOWN (not NO) |

---

## 13. Success Metrics (Platform KPIs)

| KPI | Target (12 months post Stage 1) |
|-----|--------------------------------|
| R0 escaped to prod | 0 |
| Median time to detect staging regression | < 24h (nightly) |
| DOMAIN UNKNOWN count on T2 council run | ≤ 3 domains |
| PQS on council GO runs | ≥ 85 |
| Coverage debt items > 90 days | Decreasing QoQ |
| Flake quarantine rate | < 5% of runs |

---

## 14. Governance Checkpoints

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
| 1.1 | 2026-07-03 | Stage 2 = Intelligence; adapter stages renumbered 3–8 |
| 1.2 | 2026-07-03 | Stage 2A Intelligence Core; Stage 2B/2C schemas added to roadmap |
| 1.3 | 2026-07-03 | Stage 2B complete — `.schema.md` contracts, ADR-0008 |
| 1.4 | 2026-07-03 | Stage 2C ROMA OS; machine schemas → Stage 2D |
