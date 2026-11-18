# ROMA Stage 0 — Architecture Review

**Document ID:** ROMA-REV-001  
**Version:** 1.0  
**Date:** 2026-07-03  
**Reviewer role:** Principal QA Architect + Architecture Reviewer  
**Scope:** All Stage 0 documents under `docs/roma/` (excluding this review until published)  
**Branch:** `feature/roma-qa-framework`  
**Status:** Review complete — no implementation performed

---

## 1. Executive Summary

ROMA Stage 0 delivers a **coherent, enterprise-grade architecture** for a permanent multi-surface QA control plane. The documentation set correctly separates orchestration (Core) from domain adapters (14 subsystems), defines evidence-first verdicts, respects AISTROYKA product invariants, and provides a credible staged roadmap with legacy absorption strategy.

The architecture is **strong enough to proceed to Stage 1**, subject to resolving **three documentation contradictions** and **five council decisions** documented in §8 before Stage 1 exit (not before Stage 1 start).

**Verdict:** `ROMA_STAGE0_READY_FOR_STAGE1 = YES` (conditional — see §9)

---

## 2. Documents Reviewed

| Document | ID | Assessment |
|----------|-----|------------|
| `ROMA_ARCHITECTURE.md` | ROMA-ARCH-001 | Strong — complete vision, diagram, scalability |
| `ROMA_CORE_PRINCIPLES.md` | ROMA-PRIN-001 | Strong — actionable invariants + anti-patterns |
| `ROMA_SUBSYSTEMS.md` | ROMA-SUB-001 | Strong — clear owns/does-not-own per subsystem |
| `ROMA_EXECUTION_MODEL.md` | ROMA-EXEC-001 | Strong — tiers, DAG, legacy adapter map |
| `ROMA_REPORTING_MODEL.md` | ROMA-REP-001 | Strong — hierarchy, PQS, release states |
| `ROMA_GLOSSARY.md` | ROMA-GLOS-001 | Adequate — covers core terms |
| `ROMA_ROADMAP.md` | ROMA-ROAD-001 | Strong — staged deliverables + exit criteria |
| `ROMA_MERGE_TRACKER.md` | — | **Weak** — stage numbering conflicts with roadmap |

---

## 3. Architecture Completeness

### 3.1 What is complete

| Area | Coverage | Notes |
|------|----------|-------|
| Vision & goals | ✅ | G1–G10 measurable; product-adjacent positioning clear |
| Control plane / data plane | ✅ | Text diagram + data flow |
| Subsystem catalog | ✅ | 14 subsystems — exceeds minimum requested set |
| Cross-cutting concerns | ✅ | RBAC, tenant isolation, finance isolation as domains + invariants |
| Legacy transition | ✅ | Adapter table in execution model |
| Scalability | ✅ | Horizontal subsystem growth without Core rewrite |
| Governance roles | ✅ | Architecture owner, stewards, council, security owner |
| Future module registration | ✅ | 7-step process in architecture §18 |

### 3.2 What is intentionally deferred (acceptable for Stage 0)

| Gap | Rationale |
|-----|-----------|
| JSON schema files | Stage 1 deliverable 1.4 |
| `docs/roma/inventory/`, `runs/`, `adr/`, `runbooks/` | Referenced as future paths — correct |
| RBAC matrix manifest | Stage 3 deliverable |
| Chaos scenario catalog | Stage 6 deliverable |
| Tooling choices (Playwright/XCTest/Espresso) | Principles mandate neutrality — correct |

### 3.3 Completeness score

**9/10** — Enterprise architecture bar met. Missing point: no single **architecture decision record (ADR) index** yet for resolved vs open questions.

---

## 4. Subsystem Boundaries

### 4.1 Strengths

- Every subsystem has **owns / does not own**, inputs, outputs, dependencies.
- **Worst-slice-wins** verdict rule prevents silent partial success.
- **ROMA Release** is sole aggregator — no subsystem claims release truth.
- **ROMA Learning** is advisory by default — correct separation from blocking gates.
- **ROMA Chaos** explicitly staging-only with production prohibition in principles.

### 4.2 Boundary fuzziness (minor, manageable)

| Overlap | Subsystems | Risk | Mitigation |
|---------|------------|------|------------|
| Finance denylist | SEC + WEB + BCK | Duplicate findings | Stage 2: SEC owns probe; WEB/BCK consume SEC catalog |
| RBAC validation | WEB + BCK + SEC | Unclear steward | Assign **SEC steward** for matrix; WEB executes UI paths |
| Tenant isolation | DB + SEC + AI | R0 could be reported 3× | CORE dedup by `finding_id` prefix + risk class |
| Performance on mobile | PERF + IOS + AND | Metric ownership | PERF owns budgets; mobile subsystems supply timings only |

### 4.3 Missing dedicated subsystems (by design)

Original mission listed **RBAC** and **Tenant Isolation** as validation areas. Architecture correctly models them as **cross-cutting domains** (`RBAC_READY`, `TENANT_ISOLATION_READY`) rather than standalone subsystems. **Acceptable** — but Stage 3 must publish RBAC matrix manifest to avoid orphan coverage.

### 4.4 Boundaries score

**8.5/10** — Clear enough for Stage 1 Core contracts. Steward assignments should be named in Stage 1 runbook.

---

## 5. Execution Model

### 5.1 Strengths

- **T0–T3 tiers** with duration targets and trigger matrix — operable.
- **Canonical T2 DAG** (Phases A–G) with fail-fast ordering — sound.
- **Parallelization rules** (PAR-01–05) address fixture and quota collisions.
- **Skip → UNKNOWN** semantics — aligns with fail-closed principles.
- **Environment descriptor** YAML — explicit mutation and chaos policy.
- **Credential profiles** table — maps personas to secret name refs only.
- **Legacy adapter map** — critical for Stage 1 wrapper strategy.

### 5.2 Gaps

| Gap | Severity | Recommendation |
|-----|----------|----------------|
| `pre-prod` env undefined operationally | Low | Stage 1 runbook: who provisions, or remove until needed |
| PR T1 blocking default is advisory | Low | Council ADR: promote which domains to blocking |
| No **run cancellation** semantics | Low | Stage 1 Core: SIGTERM / partial artifact handling |
| R0 short-circuit allows remaining subsystems | Info | Document expected council behavior on partial runs |

### 5.3 Execution model score

**9/10** — Ready for Stage 1 orchestration skeleton.

---

## 6. Reporting Model

### 6.1 Strengths

- **7-level hierarchy** (artifacts → learning) — clear separation of concerns.
- **Finding record schema** — sufficient for Stage 1 JSON schema derivation.
- **YES / NO / UNKNOWN** — no PASS synonym drift in council brief.
- **PQS formula** with UNKNOWN penalty — honest scoring.
- **Release states** including CONDITIONAL GO with required fields.
- **Coverage metrics** orthogonal to verdicts — correct.
- **UNKNOWN sections mandatory** in reports — strong fail-closed UX.

### 6.2 Contradictions

| Issue | Location A | Location B | Impact |
|-------|------------|------------|--------|
| **PQS weight decomposition** | `ROMA_ARCHITECTURE.md` §15 (combined domains) | `ROMA_REPORTING_MODEL.md` §6.2 (split mobile, adds OBS+CI) | Council confusion on scoring |
| **Severity vs risk class** | Principles §6.2 lists both P and R | Reporting §8 maps R→P partially | Duplicate or conflicting severities |
| **ARCHITECTURE §15 weights sum** | Lists 9 rows summing 100 | REPORTING splits SECURITY+TENANT vs RBAC+DASHBOARD | Same total, different slices |

*None of these block Stage 1*, but **PQS v1 must be single-sourced** in Stage 1 deliverable 1.4.

### 6.3 Reporting model score

**8/10** — Strong model; needs weight reconciliation ADR.

---

## 7. Risk Model

### 7.1 Strengths

- **R0–R4** classes with examples tied to AISTROYKA (stakeholder finance = R0).
- Default tier association (R0 → T0 blocking).
- Advisory risk score formula documented.
- R0 auto-elevates to P0 in reporting view.
- R4 routes to Learning — avoids noise in release gates.

### 7.2 Gaps

| Gap | Recommendation |
|-----|----------------|
| No **blast radius** enumeration (tenant / account / global) | Add to glossary + finding schema in Stage 1 |
| R1 → P0 vs P1 decision criteria vague | Council config file in Stage 1 |
| No **risk owner** field on findings | Optional Stage 2 enhancement |

### 7.3 Risk model score

**8/10** — Adequate for Stage 0; operationalize in Stage 1 schema.

---

## 8. Merge Tracker & Roadmap

### 8.1 Roadmap clarity

`ROMA_ROADMAP.md` is **clear and actionable**:

- Stages 0–7 with entry/exit criteria, non-goals, risks.
- Stage 1 scope correctly limited (Core + adapters, no new Playwright).
- Product dependencies table prevents false GO claims.
- KPIs defined for 12-month horizon.

**Roadmap score: 9/10**

### 8.2 Merge tracker issues — **must fix in Stage 1 week 1**

`ROMA_MERGE_TRACKER.md` **contradicts** `ROMA_ROADMAP.md`:

| ROMA_ROADMAP | ROMA_MERGE_TRACKER |
|--------------|-------------------|
| Stage 2: Web + Backend + Security | Stage 2: Web only |
| Stage 3: Database + RBAC + AI | Stage 3: Mobile |
| Stage 4: Mobile | Stage 4: Backend |
| Stage 5: Performance + Accessibility | Stage 5: AI |
| Stages 6–7: OBS+CHS+LRN, Council | Stages 6–11: fragmented |

**Impact:** Branch/merge governance will drift if tracker is used as source of truth.

**Required action:** Realign tracker to roadmap stages (or reference roadmap as canonical and simplify tracker to stage + branch + merged_to_main only).

### 8.3 Tracker score

**4/10** — Functional for Stage 0 branch pointer only; not safe as stage plan.

---

## 9. Contradictions Summary

| # | Contradiction | Severity | Block Stage 1? |
|---|---------------|----------|----------------|
| C1 | Merge tracker stage map ≠ roadmap | **High** (ops) | No — fix in parallel |
| C2 | PQS weights differ across ARCH vs REP | **Medium** | No — Stage 1 exit criteria |
| C3 | P vs R severity dual taxonomy | **Low** | No |
| C4 | `docs/qa/` pilot platform vs ROMA relationship undecided | **Medium** | No — Stage 1/2 decision |
| C5 | Foreman persona in principles, no role mapping | **Low** | No — Stage 3 RBAC matrix |

**No architectural contradictions** that invalidate the control-plane model.

---

## 10. Missing Decisions (Council / Owner)

| # | Decision | Needed by | Default if unset |
|---|----------|-----------|------------------|
| D1 | PQS v1 canonical weights | Stage 1 exit | Use REPORTING §6.2 |
| D2 | UNKNOWN penalty (0.3?) | Stage 1 exit | 0.3 |
| D3 | PR T1 blocking vs advisory | Stage 2 | Advisory |
| D4 | Credential profile provisioning owner | Stage 1 start | Platform ops |
| D5 | `docs/qa/` absorb vs deprecate | Stage 2 | Absorb as WEB/BCK adapters |
| D6 | Foreman → DB role mapping | Stage 3 | `admin` or `member` |
| D7 | Visual regression governance owner | Stage 5 | WEB steward |
| D8 | Chaos dedicated tenant vs shared staging | Stage 6 | Dedicated fixture tenant |

---

## 11. Readiness for Stage 1

### 11.1 Stage 1 entry criteria (from roadmap)

| Criterion | Met? |
|-----------|------|
| Stage 0 docs complete | ✅ |
| Architecture review | ✅ (this document) |
| No unresolved R0 **architecture** conflicts | ✅ |
| Secret profile **names** agreed | ⚠️ Partial — listed in execution model, not council-signed |

### 11.2 What Stage 1 can begin immediately

- ROMA Core registry (subsystem manifest YAML)
- Inventory sync → `docs/roma/inventory/routes.json`
- Artifact directory convention
- Finding + verdict JSON schema
- Legacy adapter wrappers (pilot-smoke, ci-check, ai_live_provider)
- Operator runbook v0
- Merge tracker realignment (doc-only)

### 11.3 What must not start in Stage 1 (per roadmap non-goals)

- New Playwright specs
- Mobile device lab expansion
- Chaos scenarios
- QA dashboard UI

---

## 12. Strengths (Preserve in Implementation)

1. **Evidence-first / UNKNOWN-honest** culture embedded at every layer.  
2. **Legacy adapter strategy** — avoids big-bang rewrite of 301 Vitest + existing smokes.  
3. **AISTROYKA invariants** as QA constraints, not afterthoughts.  
4. **Tool-neutral subsystem contracts** (`plan/execute/collect/verdict`).  
5. **Tiered execution** protects velocity while enabling council-depth audits.  
6. **14-subsystem decomposition** scales without Core redesign.  

---

## 13. Recommendations Before / During Stage 1 Kickoff

### Week 0 (before code)

1. **Council sign-off** on this review + Stage 0 architecture.  
2. **Realign `ROMA_MERGE_TRACKER.md`** to `ROMA_ROADMAP.md` stages.  
3. **Publish ADR-001:** canonical PQS weights (single source: reporting model).  
4. **Publish ADR-002:** `docs/qa/` transitional adapter policy.  
5. **Name subsystem stewards** in runbook v0 draft.

### Week 1–4 (Stage 1)

6. Implement Core registry + inventory sync only — no new test specs.  
7. First T0 run must emit valid `RELEASE_VERDICT.json` from legacy adapters.  
8. Assign **SEC steward** for RBAC matrix ownership (manifest in Stage 3).  

---

## 14. Scores Summary

| Dimension | Score | Ready? |
|-----------|-------|--------|
| Architecture completeness | 9/10 | ✅ |
| Subsystem boundaries | 8.5/10 | ✅ |
| Execution model | 9/10 | ✅ |
| Reporting model | 8/10 | ✅ (reconcile PQS) |
| Risk model | 8/10 | ✅ |
| Roadmap clarity | 9/10 | ✅ |
| Merge tracker | 4/10 | ⚠️ fix parallel |
| **Overall Stage 0** | **8.4/10** | **Proceed** |

---

## 15. Final Verdict

```
ROMA_STAGE0_READY_FOR_STAGE1 = YES
```

**Conditions (non-blocking for Stage 1 start, blocking for Stage 1 exit):**

1. Realign merge tracker to roadmap within Stage 1 week 1.  
2. Council ADR for canonical PQS weights before Stage 1 exit.  
3. Resolve `docs/qa/` adapter policy before Stage 2.  
4. Name credential profile provisioning owner at Stage 1 kickoff.  

Stage 0 architecture is **durable, boundary-conscious, and aligned with AISTROYKA ecosystem reality**. Proceed to Stage 1 (ROMA Core foundation) without architectural redesign.

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-03 | Initial Stage 0 architecture review |

**Related:** `ROMA_MERGE_TRACKER.md`, `ROMA_ROADMAP.md`
