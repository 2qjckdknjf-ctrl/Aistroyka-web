# ROMA Intelligence Core

**Document ID:** ROMA-INT-CORE-001  
**Version:** 1.0  
**Date:** 2026-07-03  
**Status:** Stage 2A Architecture (design only)  
**Parent:** `ROMA_INTELLIGENCE.md`  
**Layer:** Cognitive foundation (above engine specs)

---

## 1. Purpose

Defines **ROMA as an Engineering Intelligence Platform** — the central reasoning substrate that unifies quality, risk, evolution, release readiness, architecture health, and engineering confidence across the AISTROYKA ecosystem.

Stage 2A answers *how ROMA thinks*. Stage 2 engine specs answer *what each engine computes*. Stage 3+ implements adapters that consume intelligence outputs.

ROMA Intelligence Core is **recommendation-only** per ADR-0007. It never executes tests, mutates product code, or stores secrets.

---

## 2. Responsibilities

| Owns | Does not own |
|------|--------------|
| Cognitive architecture (reasoning, memory, knowledge, feedback) | Test case authoring |
| Decision semantics and confidence propagation | CI runner implementation |
| Engineering knowledge retention policy | Product business logic |
| Cross-engine orchestration contracts | Council GO vote (REL owns aggregate) |
| State machine lifecycle definition | PQS weight changes (ADR-0001) |

---

## 3. Platform Reasoning Domains

ROMA reasons about nine engineering dimensions:

| Domain | Core question | Primary models |
|--------|---------------|----------------|
| Software quality | Is behavior correct for roles and flows? | Reasoning, Evidence, Coverage engines |
| Software risk | What can fail and how badly? | Risk Model, Regression |
| Software evolution | What changed and what ripples? | Knowledge Model, Reasoning |
| Release readiness | Is it safe to ship? | Release Model, Confidence |
| Architecture health | Are boundaries and dependencies sound? | Knowledge Model, Feedback |
| Recurring failures | What patterns repeat? | Memory Model, Feedback |
| Business criticality | What matters to revenue and trust? | Risk Model, Knowledge |
| AI safety | Is AI LIVE, isolated, and non-leaking? | Risk Model, Reasoning |
| Engineering confidence | How sure are we? | Reasoning, Release, Scoring |

---

## 4. Cognitive Stack

```
┌─────────────────────────────────────────────────────────────┐
│              ROMA INTELLIGENCE CORE (Stage 2A)               │
│  Reasoning · Decision · Memory · Knowledge · Feedback        │
│  Risk Model · Release Model · State Machine · Interfaces     │
└────────────────────────────┬────────────────────────────────┘
                             │ cognitive contracts
┌────────────────────────────▼────────────────────────────────┐
│           ROMA INTELLIGENCE ENGINES (Stage 2)                │
│  Risk · Planner · Regression · Coverage · Learning · …       │
└────────────────────────────┬────────────────────────────────┘
                             │ run_plan, manifests, reports
┌────────────────────────────▼────────────────────────────────┐
│                    ROMA CORE + ADAPTERS                      │
└─────────────────────────────────────────────────────────────┘
```

*Rationale:* Separates **cognition** (why and how to think) from **computation** (engine algorithms) from **execution** (Core/adapters).

---

## 5. Inputs

| Input | Source | Role in cognition |
|-------|--------|-------------------|
| Change signals | Git, deploy SHA, inventory delta | Triggers reasoning cycle |
| System inventory | Core sync | Ground truth for "what exists" |
| Historical memory | Memory Model stores | Prior defects, trends, ADRs |
| Knowledge graph | Knowledge Model | Impact radius, dependencies |
| Run artifacts | `docs/qa/runs/{run_id}/` | Evidence for/against claims |
| Policy constraints | ADRs, mega-roadmap, security audits | Hard boundaries (finance, tenant) |
| Subsystem verdicts | Adapters | Facts feeding decisions |

---

## 6. Outputs

| Output | Consumer | Description |
|--------|----------|-------------|
| `reasoning_trace.json` | Reports, audit | Structured answer to nine reasoning questions |
| `decision_bundle.json` | Core, REL | Recommendations + confidence + rationale |
| `memory_delta.json` | Learning, LRN store | New patterns to retain |
| `knowledge_delta.json` | Graph inventory | New/changed edges and nodes |
| `state_snapshot.json` | Pipeline, dashboard | Current lifecycle state |

---

## 7. Interfaces

| Interface | Document | Direction |
|-----------|----------|-----------|
| Reasoning contract | `ROMA_REASONING_MODEL.md` | Internal — all engines |
| Decision contract | `ROMA_DECISION_ENGINE.md` | Out → Core, REL |
| Memory contract | `ROMA_MEMORY_MODEL.md` | Bidirectional — Learning |
| Knowledge contract | `ROMA_KNOWLEDGE_MODEL.md` | Bidirectional — Graph, Regression |
| Engine API | `ROMA_ENGINE_INTERFACES.md` | Out → Stage 2 engines |
| Lifecycle | `ROMA_STATE_MACHINE.md` | Orchestrates pipeline |

Stage 2 engines **implement** cognitive contracts; they do not redefine them.

---

## 8. Invariants

| ID | Invariant |
|----|-----------|
| IC-01 | Every decision includes rationale and confidence |
| IC-02 | UNKNOWN evidence caps confidence (fail-closed) |
| IC-03 | R0 / finance isolation violations block release reasoning |
| IC-04 | No secrets or credentials in memory or knowledge stores |
| IC-05 | Recommendations never auto-apply to product repos |
| IC-06 | Customer finance nodes never link to stakeholder-visible paths (G-001) |

---

## 9. Future Extensions

- Multi-repo federation (mobile + web + infra repos) under one reasoning graph
- Optional LLM-assisted reasoning overlay (council-gated, evidence-bound)
- Real-time PR reasoning stream (diff → impact → plan preview)
- Architecture drift detection (inventory vs declared ADR boundaries)
- Engineering confidence time-series API for executive dashboards

---

## 10. Open Questions

| ID | Question | Owner |
|----|----------|-------|
| Q1 | Single `reasoning_trace.json` per run vs per module? | Architecture |
| Q2 | Memory retention TTL for low-signal patterns? | Council |
| Q3 | LLM overlay allowed for reasoning narrative only, or also scoring? | Security + AI |
| Q4 | Federation: ingest Sentry/Datadog as memory facts without duplicating OBS? | OBS steward |

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-03 | Stage 2A intelligence core |
