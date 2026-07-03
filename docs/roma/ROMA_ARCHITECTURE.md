# ROMA QA Framework — System Architecture

**Document ID:** ROMA-ARCH-001  
**Status:** Architecture Baseline (Design Only)  
**Version:** 1.0  
**Date:** 2026-07-03  
**Audience:** Engineering leadership, QA architecture, platform owners, release council  
**Scope:** AISTROYKA full ecosystem — web, mobile (iOS/Android), backend, database, AI, security, release

---

## 1. Overall Vision

**ROMA** (Reliable Operations & Multi-surface Assurance) is the permanent quality-assurance platform for the AISTROYKA ecosystem. It is not a test suite; it is an **operating system for product truth**.

ROMA exists to answer one question continuously and provably:

> *Is the product safe, correct, and ready for the people who depend on it — across every surface, role, tenant, and release?*

ROMA treats quality as **infrastructure**, not a phase. It observes the product the way real users, operators, auditors, and adversaries would — and produces **evidence-backed verdicts** that gate learning, release, and remediation.

### Vision statement

AISTROYKA will maintain a single, durable QA platform that:

- spans all customer-facing and internal surfaces without architectural forks per team;
- detects regressions before users do;
- never claims success without evidence;
- respects tenant isolation and customer-finance boundaries as first-class QA constraints;
- scales with new modules, locales, roles, and devices without redesign;
- feeds continuous improvement through structured learning loops.

### Relationship to the product

ROMA sits **adjacent to** product code, never inside business logic. It consumes deployed artifacts, APIs, and observability signals. It does not modify runtime behavior except through explicitly approved chaos scenarios in non-production environments.

### Relationship to existing QA assets

AISTROYKA already has fragmented validation: Vitest unit tests, Playwright E2E, shell smokes, audit orchestrators, mobile UITests, and deploy gates. ROMA **does not replace these on day one**; it **absorbs, classifies, orchestrates, and reports** them under one architecture. Legacy assets become ROMA adapters until migrated.

---

## 2. Goals

| # | Goal | Success criterion |
|---|------|-------------------|
| G1 | **Unified assurance** | One framework coordinates web, iOS, Android, API, DB, AI validation |
| G2 | **Evidence-first verdicts** | Every PASS/YES requires traceable artifact; UNKNOWN is explicit |
| G3 | **Pre-user detection** | P0/P1 issues caught in staging or CI before production exposure |
| G4 | **Role-realistic validation** | Tests behave as owner, manager, worker, client, platform admin |
| G5 | **Tenant-safe execution** | No cross-tenant leakage in fixtures, AI probes, or reports |
| G6 | **Finance-boundary enforcement** | Stakeholder/client surfaces validated against internal-cost denylist |
| G7 | **Release council readiness** | Single release verdict consumable by go/no-go process |
| G8 | **Coverage transparency** | Untested routes, APIs, permissions, and AI flows are visible |
| G9 | **Operational durability** | Framework survives team turnover, new surfaces, and years of module growth |
| G10 | **Continuous learning** | Failures and gaps improve the system's knowledge, not just bug lists |

---

## 3. Design Philosophy

### 3.1 Quality as a control plane

ROMA is modeled as a **control plane** over the product **data plane**. The product serves users; ROMA serves engineering judgment. This separation keeps QA evolvable without entangling product releases.

### 3.2 Discovery over assumption

ROMA must discover routes, APIs, roles, and capabilities from the live system and repository inventory. It must not invent architecture. When functionality is missing, ROMA **documents absence** rather than simulating presence.

### 3.3 Progressive assurance depth

Not every check runs at every frequency. ROMA uses **assurance tiers**:

| Tier | Frequency | Depth | Typical trigger |
|------|-----------|-------|-----------------|
| T0 — Smoke | Every deploy | Shallow, fast | CI post-deploy |
| T1 — Regression | Every PR / nightly | Medium | PR gate, schedule |
| T2 — Deep audit | Weekly / pre-release | Full role/matrix | Manual / council |
| T3 — Chaos & resilience | Scheduled / gated | Adversarial | Staging only |

*Rationale:* Cost and flakiness scale with depth. Tiering preserves signal without blocking all engineering velocity.

### 3.4 Fail-closed reporting

Ambiguity resolves to **UNKNOWN**, not PASS. Missing credentials, skipped modules, or absent environments downgrade verdicts — they do not silently pass.

### 3.5 Additive evolution

New subsystems plug into ROMA Core via contracts. No subsystem owns end-to-end release truth; only **ROMA Release** aggregates verdicts.

---

## 4. Core Principles

See `ROMA_CORE_PRINCIPLES.md` for the full principle catalog. Summary:

1. **Real functionality only** — no fake tests, no mock production scale  
2. **Persona fidelity** — validate as customer, PM, worker, admin, auditor, designer, backend engineer, AI evaluator  
3. **Boundary respect** — customer finance isolation is a QA invariant  
4. **Evidence artifacts** — screenshots, traces, logs, JSON reports, hashes  
5. **Subsystem isolation** — clear inputs/outputs; no hidden cross-coupling  
6. **Idempotent orchestration** — reruns produce comparable results  
7. **Environment explicitness** — local, staging, pre-prod, prod each declared  
8. **Secret hygiene** — fixtures provisioned; never committed  
9. **Human-readable + machine-readable** — same truth in MD and JSON  
10. **Learning closure** — every P0/P1 feeds ROMA Learning

---

## 5. Architecture Diagram (Text Form)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ROMA CONTROL PLANE                                │
│                                                                             │
│  ┌─────────────┐    ┌──────────────────┐    ┌─────────────────────────┐   │
│  │ ROMA Core   │───▶│ ROMA Execution   │───▶│ ROMA Reporting          │   │
│  │ Orchestrator│    │ Model            │    │ Hierarchy               │   │
│  │ Scheduler   │    │ (tiers T0–T3)    │    │ Verdicts · PQS · Risk   │   │
│  │ Inventory   │    └────────┬─────────┘    └───────────▲─────────────┘   │
│  └──────┬──────┘             │                            │                 │
│         │                    │                            │                 │
│         ▼                    ▼                            │                 │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │              ROMA INTELLIGENCE (decision layer)                       │  │
│  │  Risk · Planner · Regression · Coverage · Learning · Confidence     │  │
│  │  Knowledge Graph · Decision Pipeline · Evidence · Scoring · Priority  │  │
│  └──────────────────────────────┬───────────────────────────────────────┘  │
│                                 │ run_plan · risk_manifest               │
│                                 ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                     SUBSYSTEM ADAPTER LAYER                           │  │
│  │                                                                       │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │  │
│  │  │ROMA Web  │ │ROMA iOS  │ │ROMA      │ │ROMA      │ │ROMA      │ │  │
│  │  │          │ │          │ │Android   │ │Backend   │ │Database  │ │  │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ │  │
│  │       │            │            │            │            │        │  │
│  │  ┌────┴─────┐ ┌────┴─────┐ ┌────┴─────────────────────────────────┐ │  │
│  │  │ROMA AI   │ │ROMA      │ │ROMA Security │ROMA A11y │ROMA Perf  │ │  │
│  │  │          │ │Observ.   │ └──────────────────────────────────────┘ │  │
│  │  └──────────┘ └──────────┘                                          │  │
│  │       ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │  │
│  │       │ ROMA Chaos   │    │ ROMA Release │    │ ROMA Learning│      │  │
│  │       │ (staging)    │    │ Council Gate │    │ Feedback Loop│      │  │
│  │       └──────────────┘    └──────────────┘    └──────────────┘      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    consumes evidence │ produces no product side-effects
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AISTROYKA PRODUCT DATA PLANE                         │
│                                                                             │
│  Public Web · Dashboard · Admin · Portal · Owner                            │
│  iOS Manager/Worker · Android Manager/Worker                                │
│  API /api/v1/* · Supabase · AI Runtime · Cloudflare Workers                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data flow summary

```
Inventory → Change detect → Intelligence (risk · plan · forecast)
    → Execute (tiered) → Collect artifacts → Normalize findings
    → Score (coverage, PQS, confidence) → Aggregate (Release verdict) → Learn → Report
```

---

## 6. Subsystems Overview

| Subsystem | Role |
|-----------|------|
| **ROMA Core** | Orchestration, inventory, scheduling, contracts, artifact store |
| **ROMA Intelligence** | Risk scoring, test planning, regression forecast, coverage debt, release confidence, executive reports — recommendation only (`docs/roma/intelligence/`) |
| **ROMA Web** | Public site, dashboard, admin, portal, owner web surfaces |
| **ROMA Android** | Android Manager + Worker native/UI/API-chain validation |
| **ROMA iOS** | iOS Manager + Worker simulator, device, Layer B live |
| **ROMA Backend** | API contracts, network behavior, error taxonomy, latency |
| **ROMA Database** | CRUD consistency, RLS assumptions, pagination, relationships |
| **ROMA AI** | Copilot, vision, streaming, fallback, tenant/memory leakage |
| **ROMA Security** | AuthZ bypass, exposure, headers, redirects, secrets |
| **ROMA Accessibility** | WCAG-oriented checks across web and mobile shells |
| **ROMA Performance** | Load, LCP/CLS budgets, API SLOs, bundle weight |
| **ROMA Chaos** | Controlled failure injection (staging only) |
| **ROMA Observability** | Correlates QA signals with runtime logs/metrics |
| **ROMA Release** | Release readiness council gate and verdict aggregation |
| **ROMA Learning** | Gap analysis, flake tracking, coverage debt, recommendations |

Detailed boundaries: `ROMA_SUBSYSTEMS.md`.

---

## 7. Responsibilities (Summary)

Each subsystem **owns validation logic for its domain** and **emits normalized findings**. None own final release truth except ROMA Release (aggregate) and ROMA Core (orchestration).

| Subsystem | Owns | Does not own |
|-----------|------|--------------|
| ROMA Core | Run plans (via Intelligence), inventory sync, artifact paths, subsystem registry | Domain-specific assertions, risk scoring logic |
| ROMA Web | Web UX, routing, i18n surfaces, responsive layout | Native mobile binaries |
| ROMA Android | Android apps, FCM, instrumented tests | iOS XCTest |
| ROMA iOS | Xcode UITest, Layer B E2E, ASC build metadata | Playwright |
| ROMA Backend | HTTP semantics, API contracts | UI layout |
| ROMA Database | Data shape, isolation, sync reconciliation | LLM prompt quality |
| ROMA AI | Provider behavior, governance, streaming | Business workflow UI |
| ROMA Security | Threat-oriented probes | Functional happy paths |
| ROMA Accessibility | A11y rulesets | Performance tuning |
| ROMA Performance | Budgets and SLOs | Security penetration depth |
| ROMA Chaos | Fault injection scenarios | Production execution |
| ROMA Observability | Signal correlation | Test authoring |
| ROMA Release | Verdict aggregation | Individual test cases |
| ROMA Learning | Trend analysis, debt register | Blocking deploy alone |

---

## 8–10. Inputs, Outputs, Dependencies

### Global inputs (all subsystems)

| Input | Source | Purpose |
|-------|--------|---------|
| Target environment descriptor | Operator / CI | base URL, platform, tier |
| Build stamp / SHA | `/api/v1/health` | Traceability |
| Credential profiles | Secret store | Role-based execution |
| System inventory snapshot | ROMA Core discovery | Coverage baseline |
| Policy constraints | Mega-roadmap, security audits | Finance isolation, RBAC |

### Global outputs

| Output | Consumer |
|--------|----------|
| Normalized finding record (JSON) | ROMA Reporting |
| Subsystem verdict (YES/NO/UNKNOWN) | ROMA Release |
| Artifact bundle (per run ID) | Humans, CI, Learning |
| Coverage delta | ROMA Learning |

### Dependency graph (logical)

```
ROMA Core
  ├── requires: inventory, environment, credential profiles
  ├── delegates planning to: ROMA Intelligence
  ├── drives: all subsystems
  └── feeds: ROMA Release, ROMA Learning

ROMA Intelligence
  ├── requires: ROMA Core inventory, Knowledge Graph, prior run artifacts
  ├── produces: run_plan, risk_manifest, release_confidence, RPT-*
  └── does not: execute tests or modify product code (ADR-0007)

ROMA Web, iOS, Android
  ├── require: ROMA Core, ROMA Backend (API truth)
  └── optional: ROMA Performance, ROMA Accessibility

ROMA Backend
  ├── requires: ROMA Core
  └── feeds: ROMA Database, ROMA Security

ROMA Database
  ├── requires: ROMA Backend, credential profiles
  └── feeds: ROMA Web/Mobile consistency checks

ROMA AI
  ├── requires: ROMA Backend, live provider policy
  └── feeds: ROMA Security (leakage), ROMA Release

ROMA Security
  ├── requires: ROMA Backend
  └── independent parallel with ROMA Accessibility

ROMA Chaos
  ├── requires: staging environment, ROMA Observability
  └── never depends on production

ROMA Release
  ├── requires: all subsystem verdicts
  └── consumes: ROMA Learning historical trends (advisory)

ROMA Learning
  ├── requires: all run artifacts
  └── advisory input to ROMA Release (non-blocking unless council elevates)
```

---

## 11. Execution Order

See `ROMA_EXECUTION_MODEL.md`. Canonical **full audit** order:

1. **Inventory sync** (ROMA Core)  
2. **Build integrity** (ROMA Release prerequisites)  
3. **ROMA Security** baseline probes (unauthenticated)  
4. **ROMA Web** public tier (T0/T1)  
5. **ROMA Backend** contract smoke  
6. **ROMA Database** consistency (authenticated)  
7. **ROMA Web** dashboard/admin/portal (role matrix)  
8. **ROMA AI** provider and governance checks  
9. **ROMA iOS** + **ROMA Android** (parallel where isolated)  
10. **ROMA Accessibility** + **ROMA Performance** (parallel)  
11. **ROMA Chaos** (T3, staging-only, optional)  
12. **ROMA Observability** correlation pass  
13. **ROMA Release** aggregation  
14. **ROMA Learning** ingestion  

*Rationale:* Cheap, fail-fast checks run before expensive mobile/AI/chaos.workloads.

---

## 12. Reporting Hierarchy

See `ROMA_REPORTING_MODEL.md`.

```
Run Artifact Bundle (raw)
    └── Subsystem Report (per domain)
        └── Domain Verdict (YES/NO/UNKNOWN)
            └── Cross-Domain Quality Score (PQS inputs)
                └── Release Readiness Verdict (ROMA Release)
                    └── Council Brief (human summary)
```

---

## 13. Risk Model

| Class | Definition | Example | Default tier |
|-------|------------|---------|--------------|
| **R0 — Existential** | Data leak, auth bypass, cross-tenant exposure | Stakeholder sees internal costs | T0 blocking |
| **R1 — Critical** | Core journey broken | Worker cannot submit report | T0/T1 blocking |
| **R2 — Major** | Degraded experience, non-core regression | Broken public asset | T1 |
| **R3 — Minor** | Cosmetic, edge locale | ES translation gap | T2 |
| **R4 — Latent** | Coverage debt, missing test | Untested API route | Learning register |

Risk **score** combines severity × blast radius × evidence confidence. ROMA Release applies council-defined thresholds.

---

## 14. Coverage Model

Three orthogonal dimensions:

| Dimension | Unit | Source |
|-----------|------|--------|
| **Surface coverage** | % pages/screens exercised | Inventory vs run manifest |
| **Contract coverage** | % API routes probed | OpenAPI/route inventory |
| **Permission coverage** | % role×action pairs tested | RBAC matrix |

Coverage is **never** a substitute for verdicts. High coverage with failing tests = NO.

---

## 14.5 ROMA Intelligence Layer (Stage 2)

> **Canonical source:** `docs/roma/intelligence/ROMA_INTELLIGENCE.md` and engine specs in `docs/roma/intelligence/`.

ROMA Intelligence is the **decision brain** between Core orchestration and subsystem adapters. It answers what to test, why, how deeply, and whether release is safe — producing `run_plan`, risk manifests, regression forecasts, coverage debt, release confidence %, and audience-specific reports.

Intelligence is **recommendation-only** (ADR-0007). Core executes approved plans; Learning ingests outcomes. No automatic production code changes.

---

## 15. Project Quality Score (PQS)

> **Canonical source:** `docs/roma/adr/ADR-0001-PQS-CANONICAL-WEIGHTS.md` — do not duplicate weights here.

Weighted composite (0–100). Ten categories (functional, backend, security, AI, mobile, design, a11y, performance, observability, release readiness). Scoring: YES = full weight, UNKNOWN = 30% (configurable), NO = 0. Documented in `ROMA_PROJECT_QUALITY_SCORE.md`.

---

## 16. Release Readiness Model

Release readiness is a **council verdict**, not a single CI green light.

| Gate type | Blocking? | Owner |
|-----------|-----------|-------|
| R0 findings = 0 | Yes | ROMA Security + ROMA Database |
| T0 smokes pass on staging | Yes | ROMA Release |
| PQS ≥ council threshold | Yes | ROMA Release |
| AI live gate (when AI touched) | Conditional | ROMA AI |
| Mobile store readiness | Conditional | ROMA iOS / ROMA Android |
| Chaos suite (major releases) | Advisory → blocking when council promotes | ROMA Chaos |

States: `GO` | `CONDITIONAL GO` | `NO-GO` | `UNKNOWN — INSUFFICIENT EVIDENCE`

---

## 17. Future Scalability

| Axis | Strategy |
|------|----------|
| New web routes | Inventory auto-diff; ROMA Web manifest extension |
| New API domains | ROMA Backend contract registry entry |
| New mobile features | Shared scenario IDs across iOS/Android adapters |
| New locales | Locale dimension in ROMA Web matrix |
| New AI capabilities | ROMA AI eval catalog entry (no Core change) |
| New tenants/accounts | Fixture profiles, never hardcoded prod tenants |
| Higher run volume | Tiered execution + parallel subsystem isolation |
| Multi-region | Environment descriptor per region; Core schedules independently |

Architecture avoids monolithic test runners. **ROMA Core** remains stable; subsystems grow horizontally.

---

## 18. Adding New Modules

1. Register subsystem in ROMA Core manifest with contract version.  
2. Define inputs, outputs, verdict schema, and tier participation.  
3. Add inventory contribution (what surfaces/APIs it owns).  
4. Wire into execution DAG position (see execution model).  
5. Assign PQS weight slice (or sub-score).  
6. Document in `ROMA_SUBSYSTEMS.md` + glossary entry.  
7. Stage 1: UNKNOWN-only participation until evidence pipeline proven.

*Rationale:* Prevents ad-hoc scripts bypassing reporting and learning loops.

---

## 19. Coding Standards (Future ROMA Development)

See `ROMA_CORE_PRINCIPLES.md` §Development Standards. Summary:

- Subsystems expose a **contract interface** to Core (plan, execute, collect, verdict).  
- No direct cross-subsystem imports; communication via Core message bus or artifact store.  
- Findings use **stable IDs** (`ROMA-<subsystem>-<category>-<nnn>`).  
- Tests and probes are **idempotent** and **environment-tagged**.  
- Secrets never in repo; profiles reference secret names only.  
- Flake budget: quarantine path through ROMA Learning, not silent retry inflation.

---

## 20. Documentation Standards

| Artifact | Location | Update trigger |
|----------|----------|----------------|
| Architecture | `docs/roma/ROMA_*.md` | Subsystem add/change |
| Subsystem spec | `ROMA_SUBSYSTEMS.md` | Boundary change |
| Runbook | `docs/roma/runbooks/` (future) | Operator workflow change |
| Verdict schema | `ROMA_REPORTING_MODEL.md` | Council threshold change |
| Inventory snapshot | `docs/roma/inventory/` (future) | Significant route/API change |
| ADR | `docs/roma/adr/` (future) | Non-trivial design decision |

All documents: version header, status, rationale for decisions, explicit UNKNOWN handling.

---

## Document Control

| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0 | 2026-07-03 | ROMA Architecture | Initial baseline |
| 1.1 | 2026-07-03 | ROMA Architecture | Stage 2 Intelligence layer (§14.5, diagram, dependency graph) |

**Related documents:** `ROMA_CORE_PRINCIPLES.md`, `ROMA_SUBSYSTEMS.md`, `ROMA_EXECUTION_MODEL.md`, `ROMA_REPORTING_MODEL.md`, `ROMA_GLOSSARY.md`, `ROMA_ROADMAP.md`, `intelligence/ROMA_INTELLIGENCE.md`
