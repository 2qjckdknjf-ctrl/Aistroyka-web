# ADR-068: Agentic Foundation

**Date**: 2026-08-29  
**Status**: accepted  
**Deciders**: Slice 01 implementation on `feature/agentic-foundation-slice-01`

## Context

AISTROYKA already has AI Brain (tools, snapshot, health, action drafts), Copilot, and platform AI governance. Product direction is a Construction AI Operating System (`OBSERVE → UNDERSTAND → DECIDE → EXECUTE → VERIFY`) without a parallel backend or graph database.

## Decision

We extend the existing Next.js + Supabase architecture with an additive Agentic Foundation:

- **Postgres graph**, no separate graph DB.
- **Skills over unrestricted agents** — explicit registry, unknown names rejected.
- **Deterministic authorization** — policy resolver is code, never LLM.
- **Human approval for writes** — Slice 01 stores proposed actions only; no execute path.
- **Evidence-backed conclusions** — structured skill context; model cannot invent entity IDs.
- **Existing DB remains source of truth** — graph binds `source_type`/`source_id`.
- **Provider abstraction** — reuse OpenAI JSON completion already used by Copilot; deterministic fallback when the provider is unavailable.

## Alternatives Considered

### Separate AI microservice + Neo4j
- **Pros**: Isolated scaling, rich graph queries.
- **Cons**: Second source of truth, Cloudflare/Worker complexity, tenant isolation duplication.
- **Why not**: Violates “extend current architecture”.

### Unrestricted LLM tool-calling against Supabase
- **Pros**: Faster prototype.
- **Cons**: SQL injection / cross-tenant risk, hallucinated writes.
- **Why not**: Fails security and human-in-control requirements.

## Consequences

### Positive
- Future agents share one protocol.
- Existing Copilot and AI Brain keep working.

### Negative
- Two related layers (AI Brain tools vs Skill Registry) until later consolidation.
- Graph is sparse until binders run.

### Risks
- PR #244 (governed AI, unmerged/conflicting) may overlap on write execution; converge later, do not merge blindly.
- Production migration must be owner-applied; this slice ships files only.
