# AI Innovation Backlog — 2026-09-08

## Purpose

This document captures the highest-value AI/product/engineering ideas selected from recent research and maps them into AISTROYKA and ROMA OS. It is a governed backlog, not an instruction to enable autonomous production behavior immediately.

## Guardrails

- New agentic capabilities default **OFF** until explicitly enabled.
- High-impact actions require runtime authorization, traceable evidence, and human approval.
- Prefer reusable skills and deterministic tools over giant prompts or many loosely coordinated agents.
- Keep models replaceable. Product behavior must not depend on a single vendor/model.
- Every production-capable agent run must emit an evidence pack: inputs, tools, changes, tests, risks, confidence, approvals, and final outcome.
- ROMA verification must remain independent from the agent/model that produced the change.
- Measure business value, latency, failure rate, and model/tool cost per workflow.

## P0 — Design / implement next

| ID | Capability | Product area | Concrete implementation | Definition of done |
|---|---|---|---|---|
| A-01 | Shared Agent Skills Registry | Agent foundation | Versioned skill manifests with purpose, input/output schema, tool dependencies, auth scopes, risk class, evaluator, and cost class. Orchestrator selects only skills relevant to the task. | Registry API + schema + validation + tests + at least 10 production-safe read skills. |
| A-02 | Runtime Authorization / Policy Engine | Agent foundation / RBAC | Effective permission = intersection of user rights, agent rights, project/tenant scope, tool policy, and action risk. Default deny. | Per-tool authorization, tenant isolation tests, deny/audit evidence, approval gates for writes. |
| A-03 | Agent Run Evidence Pack | Agent foundation / governance | Standard envelope for task, context refs, selected skills, model, tool calls, mutations, tests, policy decisions, confidence, costs and approvals. | Versioned schema + persisted evidence + ROMA validation + UI/read endpoint. |
| A-04 | Construction Graph + GraphRAG | Core intelligence | Normalize relationships: tenant → project → area/room → work package → contractor/worker → material → media → issue → decision → schedule/budget event. Combine graph traversal with vector/keyword retrieval. | Canonical graph schema, entity resolution, provenance, retrieval evals and project-scoped ACL. |
| A-05 | Site Intelligence | Manager / Worker | Photo/video → identify project/area/work type → progress → quality/safety observations → materials → delta vs prior evidence / plan. Produce proposed events, never silent writes. | Structured output schema, confidence thresholds, media provenance, manager review flow, eval dataset. |
| A-06 | Client Video-to-Scope | Client journey | Client describes work by voice/text and records video. AI creates preliminary scope, assumptions, missing questions, rough work categories and evidence links. | Guided capture, scope schema, uncertainty flags, human-editable result, no ungrounded price promises. |
| A-07 | Portfolio-aware Contractor Matching | Marketplace / client | Match by specialization, geography, availability, rating, object type, budget range, portfolio evidence and prior outcomes. Explain why each contractor matches. | Ranking model/heuristics, portfolio completeness signal, fairness checks, explainability, opt-out/override. |
| A-08 | Voice Worker | Worker mobile | Free-form voice update → structured daily report, progress event, blocker, material request and next-step proposal. | Speech→structured report, confirmation UI, multilingual support, low-friction retry, audit trail. |
| A-09 | Materials / Procurement Agent | Procurement | Need → stock → supplier availability/price/delivery → alternatives → recommendation → approval → order handoff. | Supplier adapter contract, normalized offers, substitutions policy, delivery ETA, approval before purchase. |
| R-01 | ROMA Engineering Harness | ROMA OS | Independent verification layer around coding agents: architecture, tests, security, DB, mobile, release, performance and evidence. | Orchestrated evaluators + deterministic checks + unified verdict with evidence refs. |
| R-02 | ROMA Repository Intelligence | ROMA OS | On first connection, build persistent repository map: modules, ownership, dependencies, critical paths, migrations, contracts, ADR links and test topology. Incrementally update per PR. | Versioned repo model, change impact query, stale-map detection, evidence-backed refresh. |
| R-03 | ROMA Incident Intelligence | ROMA OS | Observe logs/metrics/traces/deployments/CI → orient anomalies → propose likely causes/checks → require approval before rollback/mutation. | OODA-style workflow, causal-confidence label, incident evidence bundle, safe read-only default. |
| R-04 | ROMA Skill-based Evaluators | ROMA OS | `RomaArchitecture`, `RomaSecurity`, `RomaDatabase`, `RomaPerformance`, `RomaCrash`, `RomaVisualQA`, `RomaMobile`, `RomaRelease`, `RomaEvidence`. Skills are composable capabilities, not independent uncontrolled personas. | Skill registry integration + per-skill contract tests + orchestration rules + evidence output. |
| R-05 | Exemplar Alignment | ROMA / coding agents | Curated examples of approved PRs, migrations, ADR decisions, review comments and release evidence become retrieval context for agents/evaluators. | Curated exemplar corpus, provenance, project scoping, leakage controls, retrieval/eval tests. |

## P1 — Build after P0 contracts are stable

| ID | Capability | Concrete implementation | Expected effect |
|---|---|---|---|
| A-10 | Model Router | Route task by privacy, reasoning depth, latency, modality, context size, tool use and cost to local/cheap/frontier/vision model. | Lower cost, less vendor lock-in, better privacy and predictable latency. |
| A-11 | Agent Cost/Value Telemetry | Record model/tool cost, run duration, retries, human review time, accepted/rejected actions and business outcome. | Stop expensive low-value automation; optimize per workflow. |
| A-12 | Preconstruction AI | Early scope completeness, risk checklist, procurement lead times, schedule uncertainty, value-engineering suggestions. | Better early decisions and fewer expensive downstream changes. |
| A-13 | AI Estimator / Quantity Surveyor | Evidence-backed quantity extraction, estimate assistance, variation/change tracking and budget risk forecasting. | Faster commercial workflows with traceable assumptions. |
| A-14 | Human + AI Construction Workforce | Domain agents/skills for estimator, planner, procurement, quality, safety, document control and owner reporting. | Product evolves from chat feature toward outcome-oriented construction operating system. |
| A-15 | Multi-agent Orchestration | Small number of domain orchestrators calling reusable skills/sub-agents, with checkpoints and human-in-the-loop. | More reliable workflows than large agent swarms. |
| A-16 | Local/private inference tier | Use local/on-device models for private/routine classification/extraction when quality threshold is met. | Privacy, resilience and lower cloud cost. |
| R-06 | Development Control Plane | Identity, task queue, scheduling, isolated workspaces, permissions, observability, budget and concurrency controls for coding agents. | Safe parallel coding-agent operation across projects. |
| R-07 | Parallel Agent Workflows | Isolated agents for scoped backend/web/mobile/test tasks; ROMA merges evidence, not opinions. | Faster delivery without sacrificing review independence. |
| R-08 | Change Summary Contract | Every coding-agent task returns files changed, decisions, tests, unresolved risks, migrations, rollout/rollback notes. | Faster owner/reviewer comprehension and traceability. |

## P2 — Explore after measured evidence

| ID | Capability | Constraint before adoption |
|---|---|---|
| A-17 | Higher-autonomy execution | Only after workflow-specific evals, low failure rate, bounded permissions, rollback and cost limits. |
| A-18 | Real-time site vision / PPE detection | Requires representative field dataset, privacy/legal review, false-positive policy and device/network budget. |
| A-19 | Automatic commercial actions | Never autonomous by default; require policy thresholds and explicit commercial approval. |
| R-09 | Autonomous remediation | Only for reversible, rehearsed actions with bounded blast radius and independent post-check. |

## Architecture direction

```text
Construction / Product Surfaces
          │
          ▼
Domain Orchestrators
          │
          ▼
Shared Skill Registry ── Context / Construction Graph
          │                         │
          ▼                         ▼
Tools / MCP / APIs            Memory / GraphRAG
          │
          ▼
Runtime Policy + Authorization
          │
          ▼
Proposed Actions / Human Approval
          │
          ▼
Execution
          │
          ▼
Evidence Pack ───────────────► ROMA Independent Verification
```

## Recommended delivery sequence

1. **Contracts first:** skills, action/evidence schema, runtime authorization, cost telemetry contract.
2. **ROMA verification:** repo intelligence + skill-based evaluators + incident read-only analysis.
3. **Construction intelligence:** Construction Graph/GraphRAG, Site Intelligence, Client Video-to-Scope.
4. **Field UX:** Voice Worker and portfolio-aware contractor matching.
5. **Commercial workflows:** procurement, preconstruction, estimator/QS assistance.
6. **Routing/scale:** multi-model router, local/private tier, development control plane.
7. Increase autonomy only after workflow-specific evidence proves it safe and valuable.

## Explicit non-goals for the first implementation slice

- No uncontrolled agent swarm.
- No agent may bypass tenant/RBAC boundaries.
- No purchasing, payment, budget, contract, production migration, release or destructive action without explicit policy and approval.
- No treating model confidence as factual correctness.
- No storing untrusted retrieved content as authoritative memory without provenance/security checks.
