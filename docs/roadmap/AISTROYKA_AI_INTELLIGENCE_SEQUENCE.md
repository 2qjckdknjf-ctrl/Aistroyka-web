# AISTROYKA AI Intelligence Development Sequence

**Status:** strategic roadmap; current pilot scope is unchanged.  
**Date:** 2026-09-15  
**Rule:** do not skip dependencies. Existing contractor-ops pilot closure remains P0.

## Architecture relationship

AISTROYKA owns construction-domain truth. Grow OS is the cross-project AI control plane and ROMA is the independent governance/verification layer. AISTROYKA must not duplicate Grow OS project memory, agent identity, global model routing or ROMA governance.

```text
Grow OS control plane
   -> governed AISTROYKA agent action
   -> AISTROYKA construction domain
   -> construction evidence
   -> ROMA independent verification when privileged/critical
   -> human/manager decision where required
```

## Mandatory principles

- Finish/stabilize current contractor-ops pilot before major new AI UX.
- Add intelligence inside existing workflows before inventing new standalone AI screens.
- `RESULT CLAIM != EVIDENCE`.
- Manager/human approval remains authoritative for work acceptance, finance-sensitive decisions and customer commitments.
- AI observations must carry source/provenance and confidence; never turn uncertainty into fabricated fact.
- Reuse existing Construction Graph / AgentExecutionContext / Skill Registry / proposed-action primitives after a hard audit; do not build parallel engines.
- Runtime/model providers are replaceable. Do not bind domain state to one provider.

## Ordered tasks

### AIS-PILOT-001 — Pilot core stability (P0)

Keep contractor-ops pilot baseline stable: auth/RBAC/projects/Worker Daily Report/Manager approve-reject/issues/documents/notifications/release evidence. Portal/FULL scope stays separate until explicitly reopened.

**Gate:** existing pilot readiness/evidence gates close truthfully. No new intelligence task may bypass this gate.

### AIS-EVID-002 — Unified Construction Evidence / Observation schema

Define one evidence object usable by Worker reports, client video, inspections, defects, progress and future payment evidence.

Minimum fields:
- source type + immutable source reference;
- media timestamp/range where applicable;
- project / zone / element / work-package reference;
- finding / observation type;
- observed vs inferred classification;
- confidence;
- agent/model/runtime provenance;
- human review state;
- supersedes/related evidence lineage.

**Gate:** schema is additive, tenant-safe/RLS-safe and can represent uncertainty without pretending it is verified fact.

### AIS-VISION-003 — Worker Daily Report vision pre-check

First production-facing vision use case must enhance the existing report flow, not create a new app.

```text
Worker photo/video
 -> bounded AI observations
 -> evidence records
 -> compare to expected work / prior state
 -> ROMA/policy checks where needed
 -> Manager approve/reject
```

AI may flag progress, possible defects, missing evidence and before/after differences. It must not approve completed work instead of the Manager.

**Gate:** measurable reduction in manager review effort with no increase in false acceptance.

### AIS-GRAPH-004 — Construction Graph 2.0

Evolve the existing graph toward structured current construction state:
- zones;
- elements;
- work packages;
- materials;
- defects;
- evidence;
- progress;
- dependencies.

**Gate:** system can answer "what is currently known/built/blocked here?" with evidence links and uncertainty.

### AIS-CLIENT-005 — Client AI intake

Only after the graph/evidence layer is stable:

```text
client text/voice
 -> video walkthrough
 -> scene/zone understanding
 -> draft scope + questions
 -> client confirmation
 -> structured Construction Graph / scope
```

Do not jump directly from raw video to contractor selection without reviewable scope.

### AIS-CONTRACTOR-006 — Contractor Capability Graph

Build a structured contractor representation from verified data:
- specializations;
- geography;
- project types;
- budget bands;
- before/after portfolio evidence;
- methods/materials;
- reviews;
- schedule/quality history;
- results.

Explain to contractors that complete, truthful portfolio data improves AI matching. Never reward fabricated portfolio content.

### AIS-CAPACITY-007 — Capacity forecasting

Represent current workload, crew composition, historical duration, expected release dates and future capacity with uncertainty.

Goal: answer not only "who fits?" but "who is realistically available in 2/4/8 weeks?".

### AIS-MATERIAL-008 — Materials / Supplier Graph

Connect scope/work packages to:
- material requirements;
- supplier availability;
- price;
- geography;
- lead time;
- delivery windows;
- substitutes;
- schedule dependency.

AI may search/compare/prepare an order. Purchasing remains separately governed/approved.

### AIS-REUSE-009 — Cross-project residual/reusable materials

Track verified leftover/reusable stock across contractor projects and recommend transfers where safe/economically useful. Never assume stock exists without inventory evidence and human confirmation.

### AIS-MATCH-010 — Explainable contractor matching

Rank using:
- specialization fit;
- geography;
- availability/capacity;
- similar-project evidence;
- budget fit;
- quality/reliability;
- schedule history;
- portfolio evidence.

Every recommendation must explain why a contractor ranked and what data is missing/uncertain.

### AIS-LOOP-011 — Verified project-control loop

```text
scope
 -> contract/schedule
 -> work
 -> daily evidence
 -> AI observations
 -> ROMA verification where applicable
 -> manager/customer decisions
 -> progress/issues/payment-facing state
```

Do not expose internal contractor financial state to client/owner/stakeholder surfaces beyond designed customer-facing commercial artifacts.

## Deferred / forbidden to start early

- full 3D/world-model reconstruction before evidence/graph usefulness is proven;
- autonomous construction approval;
- autonomous supplier purchase;
- marketplace expansion before pilot/core intelligence gates;
- new model-specific architecture that duplicates Grow OS routing/governance;
- broad Android parity work solely to support an unproven AI feature.

## Agent working rule

Before Cursor/Codex implements any new AISTROYKA AI feature:

1. read `AGENTS.md`, `PROJECT_CONTEXT.md`, `STATUS.md`;
2. read this file;
3. identify the relevant `AIS-*` task and its dependencies;
4. hard-audit the existing module/primitives first;
5. implement one additive slice;
6. validate with real tests/evidence;
7. update status/handoff without starting the next blocked task automatically.
