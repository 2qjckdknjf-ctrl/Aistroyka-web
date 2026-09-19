# AISTROYKA web agent alignment

This file supplements root `/AGENTS.md` for work under `apps/web/`.

Before AI/Copilot/vision/client-intake/contractor-matching/materials work, read:
- `/PROJECT_CONTEXT.md`
- `/STATUS.md`
- `/docs/roadmap/AISTROYKA_AI_INTELLIGENCE_SEQUENCE.md`

Rules:
- Current contractor-ops pilot/release gates remain P0. Do not widen to FULL/portal or later `AIS-*` tasks without dependency closure.
- Hard-audit existing AI runtime, Construction Graph, AgentExecutionContext, Skill Registry, evidence and proposed-action primitives before adding code; extend them rather than creating parallel engines.
- `RESULT CLAIM != EVIDENCE`; AI observations need provenance/confidence and critical state transitions need the designed human/ROMA gate.
- Manager/human authority remains final for work acceptance, finance-sensitive decisions and customer commitments.
- Runtime/model providers are replaceable; do not make provider memory/domain state canonical.
- Follow tenant/RLS/customer-finance boundaries from root `AGENTS.md`.
- Implement one additive, dependency-satisfied `AIS-*` slice, validate it, record evidence/handoff, and stop at its gate.